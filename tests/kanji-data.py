"""Offline data checks; optionally compares every stroke with the downloaded ZIP."""
import hashlib
import importlib.util
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_kanji', ROOT / 'scripts/build_kanji.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def read(name):
    return json.loads((ROOT / 'data/kanji' / name).read_text(encoding='utf-8'))


categories = json.loads((ROOT / 'vocab_data.json').read_text(encoding='utf-8'))
words = [w for c in categories for t in c['topics'] for w in t['words']]
info, data, report = read('inventory.json'), read('strokes.json'), read('coverage.json')
assert info == builder.inventory(words), 'Inventory out of sync with vocabulary'
assert len(words) == 880
assert set(info['characters']) == set(data['characters'])
assert len(data['characters']) == 568
assert report['vocabularySha256'] == hashlib.sha256((ROOT / 'vocab_data.json').read_bytes()).hexdigest()
assert report['sourceRevision'] == data['source']['revision'] == builder.REVISION
assert report['missingKanji'] == report['wordsWithMissingKanji'] == []
assert report['uniqueKanji'] == report['availableKanji'] == 568
assert report['fullyCoveredWordsWithKanji'] == info['wordCountWithKanji'] == 705
assert report['wordsWithoutKanji'] == info['wordCountWithoutKanji'] == 175
assert report['strokeDataBytes'] == (ROOT / 'data/kanji/strokes.json').stat().st_size
assert data['source']['license'] == 'CC-BY-SA-3.0'
assert 'Share' in (ROOT / 'data/kanji/COPYING.KanjiVG.txt').read_text(encoding='utf-8')

for text, expected in [('準備', ['準', '備']), ('感じる', ['感']), ('様々', ['様']),
                       ('固い・硬い', ['固', '硬']), ('カメラ', []), ('いろいろ', []),
                       ('時々', ['時']), ('々〇ー', []), ('人人', ['人'])]:
    assert builder.kanji_in(text) == expected, text

for char, glyph in data['characters'].items():
    assert builder.is_kanji(char)
    assert glyph['viewBox'] == '0 0 109 109'
    count = glyph['strokeCount']
    assert count > 0 and count == len(glyph['strokes']) == len(glyph['labels'])
    assert [label['number'] for label in glyph['labels']] == list(range(1, count + 1))
    assert all(re.fullmatch(r'[MmZzLlHhVvCcSsQqTtAa0-9.,+\s-]+', d) for d in glyph['strokes'])
    assert glyph['sourceFile'] == f'kanji/{ord(char):05x}.svg'

# The reference video's character has eight strokes; catch a wrong file/variant.
assert data['characters']['刻']['strokeCount'] == 8
archive = ROOT / 'data/kanji/kanjivg-source.zip'
if archive.exists():
    assert data['source']['archiveSha256'] == hashlib.sha256(archive.read_bytes()).hexdigest()
    with zipfile.ZipFile(archive) as source:
        prefix = f'kanjivg-{builder.REVISION}/'
        assert source.read(prefix + 'COPYING') == (ROOT / 'data/kanji/COPYING.KanjiVG.txt').read_bytes()
        for char, glyph in data['characters'].items():
            raw = source.read(prefix + glyph['sourceFile'])
            assert hashlib.sha256(raw).hexdigest() == glyph['sourceSha256']
            root = ET.fromstring(raw)
            original_paths = [p.get('d') for p in root.iter(builder.SVG_NS + 'path')]
            assert glyph['strokes'] == original_paths, f'{char}: changed path geometry/order'
            original_labels = list(root.iter(builder.SVG_NS + 'text'))
            assert glyph['labels'] == [{'number': int(t.text), 'transform': t.get('transform')} for t in original_labels]
    print('PASS: all 568 glyphs match original SVG paths, order, labels and source checksums.')
else:
    print('Source ZIP absent: upstream comparison skipped (see data/kanji/README.md).')
print('PASS: 880 words, 568/568 kanji, 705 covered words, 175 kana-only entries; no kana/iteration marks in stroke data.')
