export const isImage = (name) =>
  /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);

export const isVideo = (name) =>
  /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);

export const testMediaType = (name, type) =>
  type === 'all' ? true : type === 'image' ? !isVideo(name) : !isImage(name);
