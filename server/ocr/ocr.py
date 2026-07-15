import sys
import json
import os
import logging

# Suppress PaddleOCR warnings and logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
logging.disable(logging.WARNING)

try:
    from paddleocr import PaddleOCR
except ImportError:
    print(json.dumps({"success": False, "error": "PaddleOCR package is not installed. Run 'pip install paddleocr'."}))
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided."}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File path does not exist: {file_path}"}))
        sys.exit(1)

    try:
        # Initialize PaddleOCR with English
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        result = ocr.ocr(file_path, cls=True)

        text_lines = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) > 1 and line[1]:
                    text_lines.append(line[1][0])

        full_text = "\n".join(text_lines)
        print(json.dumps({"success": True, "text": full_text}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == '__main__':
    main()
