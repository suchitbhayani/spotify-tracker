# %% Fixed training code
import os
import h5py
import numpy as np
import pandas as pd
from lightfm import LightFM
from lightfm.data import Dataset
import pickle

# %%
DATASET_PATH = "/data/MillionSongSubset"
MODEL_PATH = "/api/lightfm_msd_model.pkl"
SAVE_DATASET_PATH = '/api/lightfm_dataset.pkl'

# %% [markdown]
# read all .h5 files

# %%
def safe_decode(value):
    """Decode bytes to string; leave numbers unchanged."""
    if isinstance(value, bytes):
        return value.decode('utf-8')
    elif isinstance(value, np.ndarray) and value.dtype.kind in {'S', 'O'}:
        return value[0].decode('utf-8')
    return value

def extract_track_info(h5_file):
    """Extract track info and audio features from a .h5 file."""
    with h5py.File(h5_file, "r") as f:
        # Metadata
        meta = f['metadata/songs'][0]
        artist_name = safe_decode(meta['artist_name'])
        genre = safe_decode(meta['genre']) if 'genre' in meta.dtype.names else "unknown"
        
        # Analysis features
        analysis = f['analysis/songs'][0]
        track_id = safe_decode(analysis['track_id'])
        tempo = analysis['tempo']
        loudness = analysis['loudness']
        duration = analysis['duration']
        key = analysis['key']
        mode = analysis['mode']
        time_signature = analysis['time_signature']
        
    return {
        "track_id": track_id,
        "artist_name": artist_name,
        "tempo": tempo,
        "loudness": loudness,
        "duration": duration,
        "key": key,
        "mode": mode,
        "time_signature": time_signature
    }

# %%
# read files, load into df
tracks = []
for root, dirs, files in os.walk(DATASET_PATH):
    for file in files:
        if file.endswith(".h5"):
            file_path = os.path.join(root, file)
            try:
                info = extract_track_info(file_path)
                tracks.append(info)
            except Exception as e:
                print(f"Failed to read {file_path}: {e}")

df_tracks = pd.DataFrame(tracks)
print(f"Loaded {len(df_tracks)} tracks")


# %%
# prepare item features
all_item_features = set()
item_features_list = []

for row in df_tracks.itertuples(index=False):
    features = [
        f"tempo:{row.tempo}",
        f"loudness:{row.loudness}",
        f"duration:{row.duration}",
        f"key:{row.key}",
        f"mode:{row.mode}",
        f"time_signature:{row.time_signature}"
    ]
    all_item_features.update(features)
    item_features_list.append((row.track_id, features))

print(f"Created {len(all_item_features)} unique features")



# %%
# fit dataset with users, items, and features
dataset = Dataset()
dataset.fit(
    users=df_tracks['artist_name'].unique(),
    items=df_tracks['track_id'].tolist(),
    item_features=list(all_item_features)  # Make sure these are the feature strings
)

users = df_tracks['artist_name'].unique().tolist()  # using artists as users
items = df_tracks['track_id'].tolist()
user_item_pairs = list(df_tracks[['artist_name', 'track_id']].itertuples(index=False, name=None))
interactions, weights = dataset.build_interactions(user_item_pairs)
print('created user-item matrix')

# save dataset with correct counts
with open(SAVE_DATASET_PATH, "wb") as f:
    pickle.dump({
        "dataset": dataset,
        "num_items": len(users),
        "num_users": len(items),
        "num_item_features": len(all_item_features),
        "sample_features": list(all_item_features)[:10]  # Save some samples for debugging
    }, f)

# build item features
item_features = dataset.build_item_features(item_features_list)
print('built item features')

# %% [markdown]
# training

# %%
model = LightFM(loss='bpr', no_components=15)
model.fit(interactions, item_features=item_features, epochs=10, num_threads=1)

# %%
print('trained model')

# %%
with open(MODEL_PATH, "wb") as f:
    pickle.dump((model, dataset), f)

# %%
print('saved model')

# Add some debugging info
print(f"\nFinal verification:")
print(f"Model trained with {interactions.shape[0]} users and {interactions.shape[1]} items")
print(f"Sample features that should exist: {list(all_item_features)[:10]}")