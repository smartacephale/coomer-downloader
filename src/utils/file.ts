// import path from 'node:path';

// class CFileList {
//   files: CFile[];
//   active: CFile[];
// }

// export class CFile {
//   constructor(
//     public name = '',
//     public url = '',
//     public filepath = '',
//     public content = '',
//     public size = 0,
//     public downloaded = 0,
//     public maybeFixURL?: undefined | ((url: string) => string),
//   ) {}

//   get text() {
//     return `${this.content} ${this.name}`.toLowerCase();
//   }

//   setDir(dir: string) {
//     this.filepath = path.join(dir, this.name);
//   }
// }
