import sys

try:
    import pandas as pd
    import sklearn
    import spacy
    import pdfplumber
    print("Environment Verification SUCCESS: All dependencies are installed and can be imported.")
    sys.exit(0)
except ImportError as e:
    print(f"Environment Verification FAILED: Module missing - {e}")
    sys.exit(1)
