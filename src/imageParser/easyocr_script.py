import sys
import json
import traceback
import os
import io
import contextlib
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

def read_image():
    try:
        # Try importing easyocr
        venv_path = os.path.join(os.path.dirname(__file__), 'venv', 'Lib', 'site-packages')
        sys.path.append(venv_path)
        try:
            import easyocr
        except ImportError as e:
            error_msg = f"Failed to import easyocr. Error: {str(e)}"
            print(json.dumps({'error': error_msg}))
            return

        # Get image path from command line argument
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'No image path provided'}))
            return
            
        image_path = sys.argv[1]
        
        # Initialize EasyOCR reader
        reader = easyocr.Reader(['en'], verbose=False)
        
        # Read the image
        result = reader.readtext(image_path)
        
        # Extract text and coordinates
        extracted_data = []
        for detection in result:
            bbox, text, confidence = detection
            extracted_data.append({
                'text': text,
                'confidence': float(confidence),
                'bbox': bbox
            })
        
        # Print as JSON string using custom encoder
        print(json.dumps(extracted_data, cls=NumpyEncoder))
        
    except Exception as e:
        error_msg = f"Error: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(json.dumps({'error': error_msg}))

if __name__ == '__main__':
    read_image()