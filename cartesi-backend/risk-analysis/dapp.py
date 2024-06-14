import logging

from cartesi import DApp, Rollup, RollupData
import pickle

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)
dapp = DApp()
model = pickle.load(open("model/model.pkl", "rb"))


def str2hex(str):
    """Encodes a string as a hex string"""
    return "0x" + str.encode("utf-8").hex()


@dapp.advance()
def handle_advance(rollup: Rollup, data: RollupData) -> bool:
    payload = data.str_payload()
    LOGGER.debug("Echoing '%s'", payload)
    rollup.notice(str2hex(payload))
    return True


@dapp.inspect()
def handle_inspect(rollup: Rollup, data: RollupData) -> bool:
    try:
        # [UF, IDADE, ESCOLARIDADE, ESTADO_CIVIL, QT_FILHOS, CASA_PROPRIA, QT_IMOVEIS, VL_IMOVEIS, OUTRA_RENDA,
        # OUTRA_RENDA_VALOR, TEMPO_ULTIMO_EMPREGO_MESES, TRABALHANDO_ATUALMENTE, ULTIMO_SALARIO, QT_CARROS,
        # VALOR_TABELA_CARROS, FAIXA_ETARIA]

        # normalized data
        dados = [[
            0.5, 0.5, 0.5, 0.66666667, 0.33333333, 1.0,
            0.33333333, 0.33333333, 1.0, 0.5, 0.07042254,
            1.0, 0.17821782, 2.0, 0.38888889, 0.75
        ]]

        payload = str(model.predict(dados))
        rollup.report(str2hex(payload))

        return True

    except Exception as e:
        rollup.report(str2hex(str(e)))
        return False

if __name__ == '__main__':
    dapp.run()
