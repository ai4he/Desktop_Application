# converted .py to tensorflow

# Install libraries
"""

!pip3 install transformers datasets gdown

"""#  Import libraries"""

import re
import torch
import gdown
import transformers
import pandas as pd
import numpy as np
from datasets import load_dataset
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments, TextClassificationPipeline

import onnx

"""### Training the model"""

# Load the IMDB dataset
imdb_dataset = load_dataset("imdb")

# Define the model and tokenizer
model_name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)


# Tokenize the dataset
def tokenize(batch):
    return tokenizer(batch["text"], padding=True, truncation=True, max_length=512)

imdb_dataset = imdb_dataset.map(tokenize, batched=True, batch_size=len(imdb_dataset["train"]))
imdb_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

train_dataset = imdb_dataset['train'].train_test_split(test_size=0.2)['train']
test_dataset = imdb_dataset['train'].train_test_split(test_size=0.2)['test']
val_dataset = test_dataset.train_test_split(test_size=0.5)['test']

training_args = TrainingArguments(
  output_dir=".",
  num_train_epochs=3,              # total number of training epochs
  per_device_train_batch_size=16,  # batch size per device during training
  per_device_eval_batch_size=64,   # batch size for evaluation
  warmup_steps=500,                # number of warmup steps for learning rate scheduler
  weight_decay=0.01,               # strength of weight decay
  logging_steps=10,
)

trainer = Trainer(
  model=model,                         # the instantiated transformers model to be trained
  args=training_args,                  # training arguments, defined above
  train_dataset=train_dataset,         # training dataset
  eval_dataset=val_dataset             # evaluation dataset
)

trainer.train()
trainer.save_model("imdb_classification")

"""### Evaluating the model"""

from sklearn.metrics import classification_report
# Tokenize and encode the input
input_text = "This movie was fantastic! I really enjoyed it."
inputs = tokenizer(input_text, return_tensors="pt")

# Perform classification
result = trainer.predict(test_dataset)
labels = np.argmax(result.predictions, axis=1)
print(classification_report(test_dataset['label'], labels, target_names=['negative', 'positive']))

"""### Obtaining the dataset"""

url = "https://drive.google.com/uc?id=12c0cBC3U2kR976EZrlas4DJiOAC-z58u"
filename = "website_categories.csv"
gdown.download(url, filename, quiet=False)

# Load the CSV file into a pandas DataFrame
df = pd.read_csv(filename)

# Split the data into training, testing, and validation sets
train, test = train_test_split(df, test_size=0.2, random_state=42)

# Write each set to a new CSV file
train_file = 'train_' + filename
test_file = 'test_' + filename
train.to_csv(train_file, index=False)
test.to_csv(test_file, index=False)

"""### Data Cleaning"""

def extract_words_from_url(url):
    url = re.sub(r'https?://', '', url)  # Remove 'http://' or 'https://'
    url = re.sub(r'www\.', '', url)  # Remove 'www.'
    url = re.sub(r'\.[a-zA-Z]+', '', url)  # Remove domain extension
    url = re.sub(r'[-_/]', ' ', url)  # Replace '-', '_', and '/' with spaces
    words = re.findall(r'\b\w+\b', url)  # Extract words
    return ' '.join(words).strip()

def add_fields(df_tmp, le):
  df_tmp['text'] = df_tmp['website_url'].apply(extract_words_from_url)
  df_tmp['text'] += ' ' + df_tmp['cleaned_website_text']
  df_tmp['label'] = le.transform(df_tmp['Category'])
  return df_tmp

le = LabelEncoder()
le.fit(df['Category'])
classes = le.classes_
num_categories = len(classes)
df_train = pd.read_csv(train_file)
df_test = pd.read_csv(test_file)
df_train = add_fields(df_train, le)
df_test = add_fields(df_test, le)
df_train.to_csv(train_file, index=False)
df_test.to_csv(test_file, index=False)

"""### Training the model"""

# Load the dataset from CSV files
dataset = load_dataset("csv", data_files={"train": train_file, "test": test_file})

# Define the model and tokenizer
# model_name = "microsoft/deberta-base"
model_name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_categories)

# Tokenize the dataset
def tokenize(batch):
  return tokenizer(batch["text"], padding=True, truncation=True, max_length=512)

dataset = dataset.map(tokenize, batched=True, batch_size=len(dataset["train"]))
dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

train_dataset = dataset['train'].train_test_split(test_size=0.2)['train']
test_dataset = dataset['train'].train_test_split(test_size=0.2)['test']
val_dataset = test_dataset.train_test_split(test_size=0.5)['test']

training_args = TrainingArguments(
  output_dir=".",
  num_train_epochs=3,              # total number of training epochs
  per_device_train_batch_size=16,  # batch size per device during training
  per_device_eval_batch_size=64,   # batch size for evaluation
  warmup_steps=500,                # number of warmup steps for learning rate scheduler
  weight_decay=0.01,               # strength of weight decay
  logging_steps=10,
)

trainer = Trainer(
  model=model,                         # the instantiated transformers model to be trained
  args=training_args,                  # training arguments, defined above
  train_dataset=train_dataset,         # training dataset
  eval_dataset=val_dataset             # evaluation dataset
)

trainer.train()
trainer.save_model("website_classification")

"""### Evaluating the model

Evaluate the entire model
"""

# Perform classification
result = trainer.predict(test_dataset)
labels = np.argmax(result.predictions, axis=1)
print(classification_report(test_dataset['label'], labels, target_names=classes))

"""Evaluate a single string"""

model = AutoModelForSequenceClassification.from_pretrained('/content/website_classification/')
tokenizer = AutoTokenizer.from_pretrained(model_name)
pipe = TextClassificationPipeline(model=model, tokenizer=tokenizer, return_all_scores=False)
print(classes)
pipe("youtube video learn")

"""## 3 - Applications classification

### 3.1 - Obtaining the dataset
"""

url = "https://drive.google.com/uc?id=16gad7p-qxRxEoo_6r80oRYQOr3bFioQ8"
filename = "apps_categories.csv"
gdown.download(url, filename, quiet=False)

# Load the CSV file into a pandas DataFrame
df = pd.read_csv(filename)

# Split the data into training, testing, and validation sets
train, test = train_test_split(df, test_size=0.2, random_state=42)

# Write each set to a new CSV file
train_file = 'train_' + filename
test_file = 'test_' + filename
train.to_csv(train_file, index=False)
test.to_csv(test_file, index=False)

"""### 3.2 - Transforming the data"""

category_column_name = 'Category'
le = LabelEncoder()
le.fit(df[category_column_name])

def add_fields(df_tmp, le):
  df_tmp['text'] = df_tmp['Name'] 
  df_tmp['label'] = le.transform(df_tmp[category_column_name])
  return df_tmp

classes = le.classes_
num_categories = len(classes)
df_train = pd.read_csv(train_file)
df_test = pd.read_csv(test_file)
df_train = add_fields(df_train, le)
df_test = add_fields(df_test, le)
df_train.to_csv(train_file, index=False)
df_test.to_csv(test_file, index=False)

"""### 3.3 - Training the model"""

# Load the dataset from CSV files
dataset = load_dataset("csv", data_files={"train": train_file, "test": test_file})

# Define the model and tokenizer
model_name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_categories)

# Tokenize the dataset
def tokenize(batch):
  return tokenizer(batch["text"], padding=True, truncation=True, max_length=512)

dataset = dataset.map(tokenize, batched=True, batch_size=len(dataset["train"]))
dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

train_dataset = dataset['train'].train_test_split(test_size=0.2)['train']
test_dataset = dataset['train'].train_test_split(test_size=0.2)['test']
val_dataset = test_dataset.train_test_split(test_size=0.5)['test']

training_args = TrainingArguments(
  output_dir=".",
  num_train_epochs=3,              # total number of training epochs
  per_device_train_batch_size=16,  # batch size per device during training
  per_device_eval_batch_size=64,   # batch size for evaluation
  warmup_steps=500,                # number of warmup steps for learning rate scheduler
  weight_decay=0.01,               # strength of weight decay
  logging_steps=10,
)

trainer = Trainer(
  model=model,                         # the instantiated Transformers model to be trained
  args=training_args,                  # training arguments, defined above
  train_dataset=train_dataset,         # training dataset
  eval_dataset=val_dataset             # evaluation dataset
)

trainer.train()
trainer.save_model("apps_classification")

"""### 3.4 - Evaluating the model

Evaluate the entire model
"""

# Perform classification
result = trainer.predict(test_dataset)
labels = np.argmax(result.predictions, axis=1)
print(classification_report(test_dataset['label'], labels))

"""Evaluate a single String"""

model = AutoModelForSequenceClassification.from_pretrained('/content/apps_classification/')
tokenizer = AutoTokenizer.from_pretrained(model_name)
pipe = TextClassificationPipeline(model=model, tokenizer=tokenizer, return_all_scores=False)
print(classes)
pipe("Microsoft Office Word")

## export the model 
torch.onnx.export(model,                # model being run
                  (inputs),             # model input (or a tuple for multiple inputs)
                  "model.onnx",        # where to save the model (can be a file or file-like object)
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=12,    # the ONNX version to use
                  do_constant_folding=True,          # whether to execute constant folding for optimization
                  input_names=["input_ids", "attention_mask", "label"],   # the model's input names
                  output_names=['output'],   # the model's output names
                  dynamic_axes={'input_ids': {0: 'batch_size', 1: 'max_seq_len'},    # variable length axes
                                'attention_mask': {0: 'batch_size', 1: 'max_seq_len'},
                                'output': {0: 'batch_size'}}
                 )
