"""Gera server/data/catalog.json a partir da planilha oficial do desafio
(FIAP-Ford - Data sheet_Desafio_01_v02.xlsx) e de src/data/ranger.json.

Só usa a biblioteca padrão: o .xlsx é um zip de XML. Rodar da raiz do repo:

    python3 server/scripts/build_catalog.py
"""
import html
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / 'FIAP-Ford - Data sheet_Desafio_01_v02.xlsx'
RANGER = ROOT / 'src' / 'data' / 'ranger.json'
OUT = ROOT / 'server' / 'data' / 'catalog.json'

UNITS = {
    'Peso em ordem de marchas': 'kg',
    'Cilindrada': 'L',
    'Potência': 'cv',
    'Torque': 'Nm',
    'Economia de Combustível': 'km/l',
    'Quantidade de marchas': 'marchas',
    'Polegadas': 'pol',
    'Muitimedia polegadas': 'pol',
    'Tela no painel de instrumentos colorida por polegada': 'pol',
    'Tela no painel de instrumentos (monocromática) por polegada': 'pol',
    'Anos de garantia': 'anos',
    'Anos de garantia da bateria (HEV or BEV)': 'anos',
}


def read_sheet():
    with zipfile.ZipFile(XLSX) as z:
        shared = re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode(), re.S)
        shared = [html.unescape(''.join(re.findall(r'<t[^>]*>(.*?)</t>', s, re.S))) for s in shared]
        sheet = z.read('xl/worksheets/sheet1.xml').decode()
    rows = []
    for row in re.findall(r'<row[^>]*>(.*?)</row>', sheet, re.S):
        cells = {}
        for col, attrs, body in re.findall(r'<c r="([A-Z]+)\d+"([^>]*?)(?:/>|>(.*?)</c>)', row, re.S):
            value = re.search(r'<v>(.*?)</v>', body or '')
            if not value:
                continue
            value = value.group(1)
            cells[col] = shared[int(value)] if 't="s"' in attrs else value
        if cells:
            rows.append(cells)
    return rows


def to_number(raw):
    number = float(raw)
    return int(number) if number.is_integer() else round(number, 2)


def parse_datasheet():
    rows = read_sheet()
    versions = [rows[0][c] for c in ('B', 'C', 'D')]
    models = [rows[1][c] for c in ('B', 'C', 'D')]
    vehicles = [
        {
            'id': re.sub(r'[^a-z0-9]+', '-', f'ford {m} {v}'.lower().replace('+', ' plus')).strip('-'),
            'marca': 'Ford',
            'modelo': 'Ranger',
            'versao': v,
            'linha': m,
            'fonte': 'FIAP-Ford - Data sheet_Desafio_01_v02.xlsx',
            'specs': {},
        }
        for m, v in zip(models, versions)
    ]
    category = None
    for row in rows[2:]:
        name = row.get('A', '').strip()
        values = [row.get(c) for c in ('B', 'C', 'D')]
        if not any(values):
            category = name
            continue
        if name.startswith('Engine'):
            category = 'Engine & Transmission'
            continue
        numeric = any(v not in ('X', '0') for v in values)
        for vehicle, raw in zip(vehicles, values):
            if raw is None:
                continue
            if numeric:
                value = to_number(raw)
            else:
                value = 'Sim' if raw == 'X' else 'Não'
            vehicle['specs'][name] = {'valor': value, 'unidade': UNITS.get(name), 'categoria': category}
    return vehicles


def raptor_from_app():
    record = json.loads(RANGER.read_text(encoding='utf-8'))
    specs = {
        'Motor': {'valor': record['engine']['layout'], 'unidade': None, 'categoria': 'Engine & Transmission'},
        'Combustível': {'valor': record['engine']['fuel'], 'unidade': None, 'categoria': 'Engine & Transmission'},
        'Cilindrada': {'valor': 3, 'unidade': 'L', 'categoria': 'Engine & Transmission'},
        'Potência': {'valor': record['power']['cv'], 'unidade': 'cv', 'categoria': 'Engine & Transmission'},
        'Rotação de potência máxima': {'valor': record['power']['atRpm'], 'unidade': 'rpm', 'categoria': 'Engine & Transmission'},
        'Torque': {'valor': record['torque']['nm'], 'unidade': 'Nm', 'categoria': 'Engine & Transmission'},
        'Faixa de torque máximo': {'valor': f"{record['torque']['rpmMin']}-{record['torque']['rpmMax']}", 'unidade': 'rpm', 'categoria': 'Engine & Transmission'},
        'Tecnologia BiTurbo': {'valor': 'Sim' if 'bi-turbo' in record['engine']['layout'].lower() else 'Não', 'unidade': None, 'categoria': 'Engine & Transmission'},
        'Quantidade de marchas': {'valor': 10, 'unidade': 'marchas', 'categoria': 'Engine & Transmission'},
        'Transmissão Automática': {'valor': 'Sim', 'unidade': None, 'categoria': 'Engine & Transmission'},
        '0-100 km/h': {'valor': record['zeroToHundred']['seconds'], 'unidade': 's', 'categoria': 'Performance'},
        'Capacidade de carga': {'valor': record['payloadKg'], 'unidade': 'kg', 'categoria': 'Dimensões'},
    }
    already = {'Motor', 'Potência', 'Torque', '0-100 km/h', 'Capacidade de carga'}
    for section in record['specSections']:
        for item in section['items']:
            if item['label'] in already or 'value' not in item:
                continue
            specs[item['label']] = {'valor': item['value'], 'unidade': None, 'categoria': section['section']}
    return {
        'id': 'ford-ranger-raptor-3-0-v6',
        'marca': 'Ford',
        'modelo': 'Ranger',
        'versao': 'Raptor 3.0 V6',
        'linha': 'RANGER RAPTOR',
        'fonte': 'src/data/ranger.json (ficha exibida no app)',
        'specs': specs,
    }


def competitors_from_app():
    record = json.loads(RANGER.read_text(encoding='utf-8'))
    rows = {row['spec']: row for row in record['engineComparison']}
    brands = {'hilux': ('Toyota', 'Hilux', 'GR-S'), 'amarok': ('Volkswagen', 'Amarok', 'V6'),
              's10': ('Chevrolet', 'S10', 'High Country'), 'l200': ('Mitsubishi', 'L200', 'Triton')}
    fields = {'Potência (cv)': ('Potência', 'cv'), 'Torque (Nm)': ('Torque', 'Nm'),
              '0-100 (s)': ('0-100 km/h', 's'), 'Carga (kg)': ('Capacidade de carga', 'kg')}
    out = []
    for key, (marca, modelo, versao) in brands.items():
        specs = {}
        for spec, (label, unit) in fields.items():
            if spec in rows and key in rows[spec]:
                specs[label] = {'valor': rows[spec][key], 'unidade': unit, 'categoria': 'Engine & Transmission'}
        out.append({
            'id': re.sub(r'[^a-z0-9]+', '-', f'{marca} {modelo} {versao}'.lower()).strip('-'),
            'marca': marca, 'modelo': modelo, 'versao': versao, 'linha': None,
            'fonte': 'src/data/ranger.json (dados de demonstração do app)',
            'specs': specs,
        })
    return out


def main():
    vehicles = parse_datasheet() + [raptor_from_app()] + competitors_from_app()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'versao': 1, 'veiculos': vehicles}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(vehicles)} veículos -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
