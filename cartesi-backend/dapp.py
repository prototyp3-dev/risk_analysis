import json
import logging

from cartesi import DApp, Rollup, RollupData
import pickle

import numpy as np
from encoder import decode_payload

class InactiveTaxId(Exception):
    pass

class MissingSource(Exception):
    pass

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)
dapp = DApp()
model = pickle.load(open("model/model.pkl", "rb"))


def str2hex(str):
    """Encodes a string as a hex string"""
    return "0x" + str.encode("utf-8").hex()

def build_model_input(decoded):
    tax_id = decoded[0]
    loan_amount = decoded[1]
    obj = decoded[2]

    tax_id_type = obj["tax_id_type"]    
    tax_id_active = obj["tax_id_active"]
    if not tax_id_active:
        raise InactiveTaxId
    
    start_date = obj["company"]["start_date"]
    social_capital = obj["company"]["social_capital"]

    serasa_score = None
    serasa_total_debt = None

    for data_source in obj["data"]:
        if data_source["source"] == "serasa":
            serasa_score = data_source["score"]
            serasa_total_debt = data_source["total_debt"]
    
    if serasa_score is None:
        raise MissingSource
    
    model_input = [social_capital, loan_amount, serasa_score, serasa_total_debt]

    return np.array(model_input).reshape(1, -1)


@dapp.advance()
def handle_advance(rollup: Rollup, data: RollupData) -> bool:
    try:
        decoded = decode_payload(data.payload)
        LOGGER.info(decoded)

        model_input = build_model_input(decoded)
        LOGGER.info(model_input)

        score = model.predict(model_input)[0]
        
        rollup.notice(str2hex(json.dumps({"taxId": decoded[0], "loanAmount": decoded[1], "score": score})))
        return True
    
    except InactiveTaxId:
        rollup.report(str2hex(json.dumps({ "qualified": False, "score": 0 })))
        return False

    except MissingSource:
        rollup.report(str2hex(f"Error: Missing scores from sources\nReceived: {decoded}"))
        return False

    except Exception as e:
        rollup.report(str2hex(str(e)))
        return False


@dapp.inspect()
def handle_inspect(rollup: Rollup, data: RollupData) -> bool:
    try:
        # social_capital,loan_amount,serasa_score,serasa_total_debt
        test_input = [77956254,364775,330,26017]
        test_input = np.array(test_input).reshape(1, -1)

        payload = str(model.predict(test_input))
        rollup.report(str2hex(payload))

        return True

    except Exception as e:
        rollup.report(str2hex(str(e)))
        return False

if __name__ == '__main__':
    dapp.run()
