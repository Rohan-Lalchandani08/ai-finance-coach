import os
import pickle
import sys

# Try importing necessary libraries
try:
    import numpy as np
    import tensorflow as tf
    from sklearn.preprocessing import LabelEncoder, StandardScaler
except ImportError as e:
    print(f"Error importing libraries: {e}")
    print("Please ensure numpy, tensorflow, and scikit-learn are installed.")
    sys.exit(1)

def analyze_model():
    model_path = r'assets/models/need_vs_want_model.h5'
    if not os.path.exists(model_path):
        print(f"Model file not found: {model_path}")
        return

    try:
        model = tf.keras.models.load_model(model_path)
        print("\n=== Model Summary ===")
        model.summary()
        
        # Print input/output details
        print("\nInput Shape:", model.input_shape)
        print("Output Shape:", model.output_shape)
        
        # Save weights to JSON if possible (for JS port)
        # For now just printing structure
        for layer in model.layers:
            print(f"Layer: {layer.name}, Config: {layer.get_config()}")
            
    except Exception as e:
        print(f"Error loading model: {e}")

def analyze_pickle(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        with open(file_path, 'rb') as f:
            data = pickle.load(f)
            print(f"\n=== Analysis of {os.path.basename(file_path)} ===")
            print(f"Type: {type(data)}")
            
            if isinstance(data, LabelEncoder):
                print(f"Classes: {data.classes_}")
            elif isinstance(data, StandardScaler):
                print(f"Mean: {data.mean_}")
                print(f"Scale: {data.scale_}")
            elif isinstance(data, dict):
                # Handle dict of encoders if that's the case
                for key, value in data.items():
                    print(f"Key: {key}, Type: {type(value)}")
                    if hasattr(value, 'classes_'):
                        print(f"  Classes: {value.classes_}")
            else:
                print(data)
    except Exception as e:
        print(f"Error loading pickle {file_path}: {e}")

if __name__ == "__main__":
    base_dir = r'd:\New project\ai-finance-coach'
    os.chdir(base_dir)
    
    analyze_model()
    analyze_pickle(r'assets/models/label_encoders.pkl')
    analyze_pickle(r'assets/models/scaler.pkl')
