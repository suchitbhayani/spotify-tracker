# %%
import os
import h5py
import numpy as np
import pandas as pd
from lightfm import LightFM
from lightfm.data import Dataset
import pickle

# %%
DATASET_PATH = "/data/MillionSongSubset"
MODEL_PATH = "/app/lightfm_msd_model.pkl"
N_SAMPLES = 10_000

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
        danceability = analysis['danceability']
        energy = analysis['energy']
        key = analysis['key']
        mode = analysis['mode']
        time_signature = analysis['time_signature']
        
    return {
        "track_id": track_id,
        "artist_name": artist_name,
        "tempo": tempo,
        "loudness": loudness,
        "duration": duration,
        "danceability": danceability,
        "energy": energy,
        "key": key,
        "mode": mode,
        "time_signature": time_signature
    }

# %%
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
df_sample = df_tracks.sample(N_SAMPLES)
print(f'using {N_SAMPLES} samples for training')

# %% [markdown]
# create user-item interactions

# %%
users = df_sample['artist_name'].unique().tolist()  # pseudo-users
items = df_sample['track_id'].tolist()
user_item_pairs = list(df_sample[['artist_name', 'track_id']].itertuples(index=False, name=None))

# %%
print('created user-item interactions')

# %% [markdown]
# lightfm dataset

# %%
# 1. Prepare all possible features first
all_item_features = set()

for row in df_sample.itertuples(index=False):
    # bin numeric features
    tempo_bin = int(row.tempo // 10)        # 10 BPM per bin
    loudness_bin = int(row.loudness // 4)   # 4 dB per bin
    dance_bin = int(row.danceability*5)     # 0-5 scale
    energy_bin = int(row.energy*5)
    duration_bin = int(row.duration // 30)  # 30s intervals

    all_item_features.update([
        f"artist:{row.artist_name}",
        f"tempo:{tempo_bin}",
        f"loudness:{loudness_bin}",
        f"duration:{duration_bin}",
        f"danceability:{dance_bin}",
        f"energy:{energy_bin}"
    ])

# 2. Fit dataset with users, items, and features
dataset = Dataset()
dataset.fit(
    users=df_sample['artist_name'].unique(),
    items=df_sample['track_id'].tolist(),
    item_features=list(all_item_features)
)

# 3. Build interactions
user_item_pairs = list(df_sample[['artist_name', 'track_id']].itertuples(index=False, name=None))
(interactions, weights) = dataset.build_interactions(user_item_pairs)

# 4. Build item features
item_features_list = []
for row in df_sample.itertuples(index=False):
    tempo_bin = int(row.tempo // 10)        # 10 BPM per bin
    loudness_bin = int(row.loudness // 4)   # 4 dB per bin
    dance_bin = int(row.danceability*5)     # 0-5 scale
    energy_bin = int(row.energy*5)
    duration_bin = int(row.duration // 30)  # 30s intervals

    features = [
        f"artist:{row.artist_name}",
        f"tempo:{tempo_bin}",
        f"loudness:{loudness_bin}",
        f"duration:{duration_bin}",
        f"danceability:{dance_bin}",
        f"energy:{energy_bin}"
    ]
    item_features_list.append((row.track_id, features))

item_features = dataset.build_item_features(item_features_list)

# %%
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


