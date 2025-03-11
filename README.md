## Coomer / Kemono / Bunkr / Reddit-NSFW Downloader

_For reddit content script parsing nsfw.xxx aggregator._

### Features
* script keeps track of downloaded files and resume downloading if it's crashed. 

### Installation:
```
npm install -g coomer-downloader
```

### How to use:

* #### COOMER/KEMONO: 
```
npx coomer-downloader --u https://coomer.su/onlyfans/user/<username>
```
* #### BUNKR: 
```
npx coomer-downloader --u https://bunkr.sk/a/<ID> --exclude superboobs
```
* #### REDDIT:
```
npx coomer-downloader --u u/<username>
```
* #### You can also download any file with it as a curl:
```
npx coomer-downloader --u https://random.com/file.mp4 --include megatits
```

### Options:
```
--dir <directory>
--media <video|image|all>

# include/exclude filters files by name
--include <keyword1>
--exclude <keyword2>
```

```
⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠄⠐⠠⠐⠠⢂⢂⢂⢺⢽⢯⢿⢽⢽⢽⢵⡣⠂⠄⡐⠠⠐⠠⠐⠠⠐⡀⡂⡐⢐
⠀⠄⠀⠀⠀⠀⠀⠀⠄⢀⠂⠡⠈⠌⡨⢐⢐⢐⢭⣻⣽⣻⡽⣯⢯⣗⢇⢑⠨⠐⡈⠌⡨⠈⢌⢐⠐⠄⢌⢐
⠐⡀⠀⠀⠀⠀⠀⠐⠀⢂⠐⡈⠌⡐⡐⠔⡐⣕⣞⣾⣳⣯⢿⡝⡝⡌⢄⠄⠌⠂⢌⢂⢂⠅⢅⠢⠡⡑⡐⡐
⠁⠄⡀⠀⡀⠀⡀⠄⠡⢀⠂⠄⠅⡂⢌⢌⠢⡒⡝⡞⡟⡞⡏⢎⠪⠨⢂⠌⠌⡨⢐⠌⢔⠨⡂⢅⠕⡐⡐⠔
⠅⠅⡂⠡⠐⡐⠄⢅⢑⢐⠌⢄⠕⡠⡑⢔⠡⠢⡑⢌⠢⢑⢈⢂⠅⠡⠀⠌⡐⠠⡑⢌⠢⡑⡌⢆⠪⡐⢌⠢
⡈⠢⠨⡈⡂⡢⠡⡑⢌⢢⢡⠱⡨⢢⢑⢅⠪⡨⢂⠅⡪⢐⠰⡐⠌⢌⢐⠡⢐⠡⠨⡂⡇⡕⢜⢰⢑⢌⠢⡑
⡨⠨⢊⠔⡐⢌⢒⠸⡨⡢⡱⡑⡜⢜⢜⡐⢅⠢⡑⠌⠔⡡⢊⠔⠡⢂⢂⠪⡐⢌⠪⡘⡔⡕⡕⢕⢌⢆⠣⡊
⠢⡑⡡⢊⢌⢢⢡⢑⢕⢜⢌⢎⢎⢎⢖⢜⢐⡑⠌⢌⢊⠄⠕⢌⢊⠔⢐⠐⢌⠢⡑⢕⢕⢕⡕⡕⡕⡜⢌⢢
⡢⢑⢌⢢⠱⡰⡡⡃⡇⡇⣇⢇⢇⢧⢣⠣⡑⢌⢊⠢⡡⢊⢊⠪⡐⠌⡂⢅⢑⢌⠪⡪⣎⢧⡳⡱⡕⡕⡕⢅
⠔⢅⢆⠕⡕⢜⢔⢕⢕⡝⡼⡸⣕⢗⠇⠣⠑⢁⠁⠅⠂⠡⢈⢈⠀⡁⢈⠐⠁⠆⠣⡣⣳⢳⢝⣎⢧⢣⢣⢃
⡅⡣⡢⡣⡣⡣⡣⣣⢳⡹⡪⠣⠡⠁⠌⠄⡁⠂⠄⡡⠨⡨⡐⠄⡂⠠⠀⡐⠀⠌⠀⠌⠘⠹⣕⢧⡳⡝⡜⡌
⢎⢢⢣⢪⢪⡪⣇⢧⠣⢃⠌⡂⠅⢅⠡⠂⡂⠅⠡⡂⠅⡇⣊⢂⠂⠌⠠⠀⠂⠄⠁⠄⡁⢂⢈⠳⣹⡪⣣⠣
⡸⡰⡱⡱⣕⢧⡳⡑⢅⠕⡐⢌⠌⢔⠨⡐⠄⢅⠱⡐⢕⢕⢌⢆⢑⠨⢀⠅⠨⢀⢁⢂⠐⠄⡂⡐⡑⡽⣸⢘
⡊⡎⣎⢞⢼⢪⢢⢑⢅⠕⡜⡐⡅⢕⠨⡐⠅⡅⡕⡜⣜⣗⢕⢕⢐⠌⠔⡨⢈⠄⡂⡐⠨⢐⢐⢐⢐⢘⢜⠔
⢣⡣⣳⡹⡕⡕⡜⡌⡆⡇⡇⡕⢜⢔⠱⡘⢌⢢⢣⢣⢿⣳⡣⡣⡱⠨⡊⢔⢐⠌⡔⢌⢌⠢⡂⢆⠢⡑⢔⠱
⡣⡳⡵⡝⡜⡜⡜⡜⡜⡜⡜⡜⡜⡔⡕⡱⡑⡕⡕⣝⡿⣯⡺⡸⡘⣌⠪⡢⡡⡣⡊⡆⢎⢌⠪⡢⢱⢘⢔⠕
⢏⡞⡮⡳⡱⡕⣕⢇⢗⢕⢵⡱⡕⣕⢕⢕⢕⢕⣝⢮⣿⢷⡹⡜⡜⡆⡇⡇⡎⡆⡇⡇⡇⡇⡇⡇⡣⡱⡡⡣
⢵⡹⣝⣝⢜⢮⡺⡜⡵⣹⢪⡺⣜⢮⡪⡧⡫⡧⣳⡯⣿⢽⣳⢝⣜⢮⢺⢪⡺⡜⣎⢮⢪⡪⡪⡪⡪⡪⡪⡪
⣗⢽⣺⡪⡳⣕⢗⡝⣞⢮⡳⣝⢮⣳⢽⣺⢽⡽⣗⣿⢽⣻⣺⣻⢮⣞⡽⣕⣗⣝⢮⢎⡧⣳⢹⢪⡣⣫⢪⢎
⢮⣳⡳⡽⣕⢗⣝⢮⡳⡳⣝⣞⢽⣪⢟⡮⣻⣺⣻⣞⣯⣟⡾⣽⢯⣞⢽⢵⡳⡽⣹⢵⢝⣎⢗⡵⣝⢜⣎⢧
⣗⣗⢽⣽⡪⣗⢗⡽⣺⢝⣞⢮⢯⣺⣳⣫⢷⣻⣞⣾⣞⡾⣽⢽⣳⢗⡯⣳⢝⡽⣪⢗⣗⢵⢝⢮⢮⡳⡕⣇
⣞⢮⣟⡮⣯⡺⣝⣞⡵⣻⣪⢯⣳⣳⣳⡽⡿⣽⢾⡽⣗⣯⡷⣻⣽⢽⢽⣺⢝⣞⣗⢽⡪⣏⢯⡳⡳⣝⢞⣎
⣞⡽⡾⣝⣗⣯⣗⡷⣝⡷⡽⣽⣺⢾⣽⢽⣯⣯⢷⣿⣻⣯⡿⣳⡿⣯⡿⣞⣽⡺⣮⣻⡺⣵⡫⣞⣝⢮⡳⣕
⢾⢽⢝⡞⡮⣞⢾⢝⡯⣟⣟⣷⣟⣿⣞⣟⢷⢽⢯⣷⣻⢮⣟⣯⣟⣯⣯⣳⢽⢽⣞⡮⣟⡮⡯⣞⢮⣳⣝⣮
⡽⣝⢵⢝⢮⡳⡽⣹⢽⢵⣻⣺⡯⣟⣾⢽⡽⣝⡿⣞⣾⣳⣳⡿⣾⢷⣳⡯⣿⢽⡾⣽⣳⣻⡽⡯⣟⡞⣞⢜
⣽⣪⢳⡹⡪⡮⡫⡮⣳⢯⣞⡷⣟⣯⢿⡽⣽⢽⢾⢽⢞⣾⣷⡿⣿⢿⣷⣻⣳⣻⣻⡽⣞⣗⢯⣻⡪⣞⢜⢎
⣳⡪⣳⢹⡪⡳⣝⣝⢮⡳⣗⡿⡯⡯⣯⡻⡮⣟⢽⢽⣹⢽⣾⣟⣯⣿⡯⣗⡯⣿⢽⡯⡷⡽⣝⢞⢮⡺⡜⡕
```
