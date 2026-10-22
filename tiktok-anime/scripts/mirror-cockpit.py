# コックピットのシーンを左右反転する（機長＝左席は、正面から見ると画面の右側）
import json, sys
W = 1080
def flip_x(d, key='x'):
    if isinstance(d, dict) and isinstance(d.get(key), (int, float)):
        d[key] = W - d[key]
for path in sys.argv[1:]:
    ep = json.load(open(path))
    n = 0
    for s in ep['scenes']:
        if s.get('background') != 'cockpit':
            continue
        n += 1
        for c in s.get('characters', []):
            flip_x(c)
            flip_x(c.get('yokePos'))
            flip_x(c.get('move'))
            if c.get('look') in ('left', 'right'):
                c['look'] = 'right' if c['look'] == 'left' else 'left'
            if c.get('reachArm') in ('left', 'right'):
                c['reachArm'] = 'right' if c['reachArm'] == 'left' else 'left'
        for o in s.get('overlays', []):
            if o.get('type') == 'bubble':
                flip_x(o)
        for c in s.get('cuts', []):
            flip_x(c, 'focusX')
        flip_x(s.get('camera'), 'focusX')
    json.dump(ep, open(path, 'w'), ensure_ascii=False, indent=1)
    print(path, n, 'scenes mirrored')
