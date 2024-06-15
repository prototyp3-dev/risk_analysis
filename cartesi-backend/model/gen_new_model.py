import pandas
from sklearn.metrics import r2_score
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import numpy as np

#Loading data
df = pandas.read_csv("data.csv")

#Print a sample of the data
print(df.head())

data_no_score = df.iloc[:,4:] # ignore tax_id,tax_id_type, tax_id_active, start_date

print(data_no_score.head())
target = data_no_score.pop("score")

X_train, X_test, y_train, y_test = train_test_split(data_no_score, target, test_size = 0.3, random_state = 40)

model = LinearRegression(fit_intercept = True)
model = model.fit(X_train.values, y_train)

print("R2 Score:", r2_score(y_test, model.fit(X_train.values, y_train).predict(X_test.values)))

import pickle

pickle.dump(model, open('model.pkl', 'wb'))

#Performing quick test on model

#social_capital, loan_amount, serasa_score, serasa_total_debt, scr_score, scr_total_debt
test_input = [77956254,364775,330,26017,942,848023]
test_input = np.array(test_input).reshape(1, -1)

print("result: ", model.predict(test_input))
