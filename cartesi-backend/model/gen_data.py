import random
import math

# returns a random date between 1/1/1970 00:00:00 and 06/15/2024 10:00:00
def random_date():
    timestamp = random.randint(0, 1718445600)
    return timestamp

    

def gen_data():
    tax_id = f"{random.randint(10000000, 99999999)}{'0001'}{random.randint(10,99)}"
    tax_id_type = "cnpj"
    tax_id_active = True

    start_date = random_date()
    social_capital = random.randint(10000, 100000000)
    loan_amount = random.randint(1000, 10 * social_capital)
    serasa_score = random.randint(0, 1000)
    serasa_total_debt = random.randint(10000, 10 * social_capital)
    scr_serasa_error_factor = random.randint(-2,2)/10
    scr_score = int(serasa_score * (1 + scr_serasa_error_factor + random.randint(-5,5)/100))
    if scr_score < 0:
        scr_score = 0
    if scr_score > 1000:
        scr_score = 1000
    scr_total_debt = int(serasa_total_debt * (1 - scr_serasa_error_factor))
    avg_debt = (serasa_total_debt + scr_total_debt)/2
    loan_to_social_capital_diff = avg_debt + loan_amount - social_capital

    log10 = 0
    if loan_to_social_capital_diff>0:
        log10 = math.log(loan_to_social_capital_diff, 10)
    else:
        log10 = math.log(-1 * loan_to_social_capital_diff, 10)
    normalizing_value = 10**(math.floor(log10+1))
    loan_to_capital_factor = loan_to_social_capital_diff/normalizing_value
    score = int((serasa_score*0.7 + scr_score*0.3) * (1 + random.randint(-1,1)/10) * (1 - loan_to_capital_factor/10))
    if score > 1000:
        score = 1000

    return f"{tax_id},{tax_id_type},{tax_id_active},{start_date},{social_capital},{loan_amount},{serasa_score},{serasa_total_debt},{scr_score},{scr_total_debt},{score}"



with open("data.csv", "w") as f:
    header = "tax_id,tax_id_type,tax_id_active,start_date,social_capital,loan_amount,serasa_score,serasa_total_debt,scr_score,scr_total_debt,score"
    print(header, file=f)

    for i in range(5000):
        x = gen_data()

        print(x, file=f)

