import urllib.request, json, urllib.error
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/chat/', data=json.dumps({'message': 'hi'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
