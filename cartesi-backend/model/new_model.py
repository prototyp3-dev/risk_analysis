import pandas
from sklearn.metrics import r2_score
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import numpy as np

df = pandas.read_csv("data.csv")

# replace cnpj by 1
df.replace('cnpj', 1, inplace = True)

#data_no_score = df.copy()
data_no_score = df.iloc[:,3:] # ignore tax_id,tax_id_type, tax_id_active

target = data_no_score.pop("score")

X_train, X_test, y_train, y_test = train_test_split(data_no_score, target, test_size = 0.3, random_state = 40)

model = LinearRegression(fit_intercept = True)
model = model.fit(X_train.values, y_train)

print("R2 Score:", r2_score(y_test, model.fit(X_train.values, y_train).predict(X_test.values)))

import pickle

pickle.dump(model, open('model.pkl', 'wb'))


# tax_id,tax_id_type,tax_id_active,start_date,social_capital,loam_amount,serasa_score,serasa_total_debt,scr_score,scr_total_debt
# test_input = [43958492000180,1,True,1341430861,77956254,364775,330,26017,942,848023]

# start_date,social_capital,loam_amount,serasa_score,serasa_total_debt,scr_score,scr_total_debt
test_input = [1341430861,77956254,364775,330,26017,942,848023]
test_input = np.array(test_input).reshape(1, -1)

print("result: ", model.predict(test_input))