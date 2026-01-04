## Coomer / Kemono / Bunkr / GoFile / Reddit-NSFW Gallery Downloader

[![NPM](https://nodei.co/npm/coomer-downloader.svg?color=lightgrey)](https://www.npmjs.com/package/coomer-downloader)

<img src="https://github.com/smartacephale/coomer-downloader/blob/main/docs/images/Screenshot%2001.jpg?raw=true" width="500"></img>

### Features
* Script keeps track of downloaded files and resume downloading if it's crashed.
* Skip files, filter by text and media type
* Preview images in console. For now partial downloads not supported.

### Install:
```
npm install -g coomer-downloader
```
### Update:
```
 npm update -g coomer-downloader
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
--media <video|image>
--skip <number>

# Removes duplicates by url and file hash
--remove-dupilicates <true|false>

# Filter by file name
--include <keyword1>
--exclude <keyword2>

# Filter by min/max file size. Example: "1mb" or "500kb"
--min-size <keyword>
--max-size <keyword>

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
