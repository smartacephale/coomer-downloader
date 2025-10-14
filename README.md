## Coomer / Kemono / Bunkr / GoFile / Reddit-NSFW Downloader

### Features
* script keeps track of downloaded files and resume downloading if it's crashed. 

### Installation:
```
npm install -g coomer-downloader
```

### How to use:

* #### COOMER/KEMONO: 
```
npx coomer-downloader --u https://coomer.st/onlyfans/user/<username>
```
* #### BUNKR: 
```
npx coomer-downloader --u https://bunkr.sk/a/<ID>
```
* #### GoFile: 
```
npx coomer-downloader --u https://gofile.io/d/<ID>
```
* #### REDDIT:
_Reddit content parsed with nsfw.xxx_
```
npx coomer-downloader --u u/<username>
```
* #### Download files like curl:
```
npx coomer-downloader --u https://random.com/file.mp4
```

### Options:
```
--dir <directory>
--media <video|image|all>
--skip <number>

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
