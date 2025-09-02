# can only predict with existing users.

from fastapi import FastAPI, HTTPException
import pickle
import numpy as np
from lightfm import LightFM
from scipy.sparse import csr_matrix
import os

# load model & dataset
BASE_DIR = os.path.dirname(__file__)  # folder containing main.py

MODEL_PATH = os.path.join(BASE_DIR, "lightfm_msd_model.pkl")
with open(MODEL_PATH, "rb") as f:
    model, _ = pickle.load(f)

DATASET_PATH = os.path.join(BASE_DIR, "lightfm_dataset.pkl")
with open(DATASET_PATH, "rb") as f:
    data = pickle.load(f)

dataset = data['dataset']
num_users = data['num_users']
num_items = data['num_items']

print(f"Loaded dataset with {num_users} users, {num_items} items")

user_mapping = dataset.mapping()[0]  # user_id -> internal_id
item_mapping = dataset.mapping()[2]  # item_id -> internal_id
internal_to_item = {v: k for k, v in item_mapping.items()} # internal_id -> item_id



# Fast API
app = FastAPI(title="Spotify LightFM Recommender")

@app.get('/artists')
def artists():
    """
    Returns all artists we can make recommendations for
    """
    artist_list = sorted(user_mapping.keys())
    return {"artists": artist_list}

@app.get("/predict")
def predict(user_id: str):
    """
    Predict top 5 tracks for an existing user.
    """

    if user_id not in user_mapping:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not in training dataset")

    internal_user_id = user_mapping[user_id]

    scores = model.predict(
        user_ids=internal_user_id,
        item_ids=np.arange(num_items),
    )
    top_indices = np.argsort(-scores)[:5]
    top_item_ids = [internal_to_item[i] for i in top_indices]

    return {
        "user_id": user_id,
        "top_items": top_item_ids,
        "cold_start": False
    }