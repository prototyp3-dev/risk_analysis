import random

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
    loam_amount = random.randint(1000, 1000000)
    serasa_score = random.randint(100, 1000)
    serasa_total_debt = random.randint(10000, 1000000)
    scr_score = random.randint(100, 1000)
    scr_total_debt = random.randint(10000, 1000000)
    score = int((serasa_score*0.7 + scr_score*0.3) / 2)

    return f"{tax_id},{tax_id_type},{tax_id_active},{start_date},{social_capital},{loam_amount},{serasa_score},{serasa_total_debt},{scr_score},{scr_total_debt},{score}"



with open("data.csv", "w") as f:
    header = "tax_id,tax_id_type,tax_id_active,start_date,social_capital,loam_amount,serasa_score,serasa_total_debt,scr_score,scr_total_debt,score"
    print(header, file=f)

    for i in range(5000):
        x = gen_data()

        print(x, file=f)

