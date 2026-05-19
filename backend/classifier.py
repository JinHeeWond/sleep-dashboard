"""자세 분류기 — 로컬 MobileNetV2+SVM 우선, 신뢰도 미달 시 Gemini fallback."""

import os
import logging
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
logging.getLogger("tensorflow").setLevel(logging.ERROR)

import google.generativeai as genai
from PIL import Image as PILImage

VALID_POSTURES = {"Supine", "Lateral_L", "Lateral_R", "Prone", "Unknown"}

SYSTEM_PROMPT = """\
당신은 수면 자세 분류 전문가입니다.
제공된 이미지에서 사람의 수면 자세를 분析하여 반드시 아래 형식으로만 응답하세요.

응답 형식 (다른 텍스트 없이 이 형식만): 대분류|세부분류

[카메라 관점]
이미지는 사이드뷰(옆면)입니다. 사람의 몸이 세로로 서 있는 것처럼 보입니다.

[대분류] 몸통 방향 — 다음 중 하나:

- Supine    : 카메라에 얼굴·가슴(정면)이 바로 보이는 자세. 두 눈이 카메라를 향함. 앙와위.

- Lateral_L : 카메라에 왼쪽 옆면이 보이는 자세.
  • 얼굴이 보일 때: 왼쪽 귀·왼쪽 뺨이 카메라 가까이 있음. 코끝이 오른쪽을 향함.
  • 등이 보일 때: 몸이 왼쪽으로 기울어짐. 왼쪽 어깨가 오른쪽보다 낮거나 앞에 있음.

- Lateral_R : 카메라에 오른쪽 옆면이 보이는 자세.
  • 얼굴이 보일 때: 오른쪽 귀·오른쪽 뺨이 카메라 가까이 있음. 코끝이 왼쪽을 향함.
  • 등이 보일 때: 몸이 오른쪽으로 기울어짐. 오른쪽 어깨가 왼쪽보다 낮거나 앞에 있음.

- Prone     : 카메라에 등이 정면으로 바로 보이는 자세. 등이 카메라와 평행하게 마주함. 복와위.

- Unknown   : 사람이 전혀 보이지 않거나 완전히 가려진 경우만 사용.

⚠️ 핵심 구분 규칙:

[Lateral_L vs Lateral_R]
- 얼굴이 보이면: 어느 쪽 귀·뺨이 카메라에 가까운지 확인.
  왼쪽 귀/뺨 → Lateral_L,  오른쪽 귀/뺨 → Lateral_R
- 등이 보이면: 어깨 높이와 몸의 기울기로 판단.
  몸이 왼쪽으로 기울면 → Lateral_L,  오른쪽으로 기울면 → Lateral_R
- L/R이 불명확해도 Unknown 대신 최선의 L 또는 R을 선택하세요.

[Prone vs Lateral - 등이 보이는 경우]
- Prone: 등이 카메라와 정면으로 마주하고, 양쪽 어깨 높이가 같음. 몸이 기울지 않음.
- Lateral: 등이 보여도 몸이 한쪽으로 기울어지고 한쪽 어깨가 더 높이/앞에 보임.
- 등이 보인다고 자동으로 Prone이 되지 않습니다. 몸의 기울기를 반드시 확인하세요.

[세부분류] 팔/다리 세부 자세 — 다음 중 하나:
- Log       : 팔을 몸에 딱 붙이고 직선으로 자는 자세. Lateral 계열.
- Yearner   : 두 팔을 앞으로 뻗고 자는 자세. Lateral 계열.
- Soldier   : 팔을 차렷 자세로 몸에 붙여 자는 자세. Supine 계열.
- Freefall  : 양손으로 베개를 감싸고 고개를 옆으로 돌린 자세. Prone 계열.
- Feotus    : 옆으로 누워 무릎을 가슴 쪽으로 끌어안고 몸을 둥글게 말고 자는 자세.
- Unknown   : 팔/다리 세부 자세 판별 불가

⚠️ 대분류별 허용 세부분류:
- Supine    → Soldier, Unknown
- Lateral_L → Log, Yearner, Feotus, Unknown
- Lateral_R → Log, Yearner, Feotus, Unknown
- Prone     → Freefall, Unknown
- Unknown   → Unknown\
"""


class PostureClassifier:
    def __init__(self):
        self._gemini   = self._load_gemini()
        self._local, self._extractor = self._load_local()

    # ── 초기화 ───────────────────────────────────────

    def _load_gemini(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("[Gemini] ⚠️  GEMINI_API_KEY 없음")
            return None
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        print("[Gemini] ✅ 초기화 완료")
        return model

    def _load_local(self):
        model_path = Path(__file__).parent / "posture_model.pkl"
        if not model_path.exists():
            print("[로컬 모델] posture_model.pkl 없음 → Gemini 단독 사용")
            return None, None
        try:
            import joblib
            from tensorflow.keras.applications import MobileNetV2

            data      = joblib.load(model_path)
            extractor = MobileNetV2(
                weights="imagenet", include_top=False,
                pooling="avg", input_shape=(*data["img_size"], 3),
            )
            extractor.trainable = False
            print(f"[로컬 모델] ✅ 로드 완료 (임계값 {data['conf_threshold']*100:.0f}%)")
            return data, extractor
        except Exception as e:
            print(f"[로컬 모델] 로드 실패: {e}")
            return None, None

    # ── 분류 ─────────────────────────────────────────

    def classify(self, image_path: str) -> str:
        """로컬 모델 우선 → 신뢰도 미달 시 Gemini fallback."""
        result = self._classify_local(image_path)
        if result:
            return result
        return self._classify_gemini(image_path)

    def _classify_local(self, image_path: str) -> str | None:
        if self._local is None or self._extractor is None:
            return None
        try:
            import numpy as np
            from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

            img  = PILImage.open(image_path).convert("RGB").resize(self._local["img_size"])
            x    = preprocess_input(np.array(img, dtype=np.float32)[None])
            feat = self._extractor.predict(x, verbose=0)
            prob     = self._local["svm"].predict_proba(feat)[0]
            pred_idx = int(prob.argmax())
            conf     = float(prob[pred_idx])
            label    = self._local["label_encoder"].inverse_transform([pred_idx])[0]

            if conf >= self._local["conf_threshold"]:
                print(f"  [로컬] {label} ({conf*100:.0f}%)")
                return label
            print(f"  [로컬] {label} ({conf*100:.0f}%) — 낮음 → Gemini fallback")
        except Exception as e:
            print(f"  [로컬] 오류: {e}")
        return None

    def _classify_gemini(self, image_path: str) -> str:
        if self._gemini is None:
            return "Unknown"
        try:
            response = self._gemini.generate_content(
                ["이 이미지의 수면 자세를 분류하세요.", PILImage.open(image_path)]
            )
            text = response.text.strip()
            for label in VALID_POSTURES:
                if label in text:
                    return label
        except Exception as e:
            print(f"  [Gemini] 분류 실패: {e}")
        return "Unknown"
