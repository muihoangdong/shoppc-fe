import React, { useState } from 'react';

/** Ảnh hiện dần khi tải xong (không "giật" từ trống sang có ảnh). Ảnh đã có trong bộ nhớ đệm thì hiện ngay. */
const FadeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className = '', onLoad, onError, ...props }) => {
  const [shown, setShown] = useState(false);
  return (
    <img
      {...props}
      ref={(el) => {
        if (el && el.complete && el.naturalWidth > 0 && !shown) setShown(true);
      }}
      onLoad={(e) => {
        setShown(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setShown(true); // lỗi ảnh vẫn hiện chữ thay thế (alt) thay vì ô trống
        onError?.(e);
      }}
      className={`transition duration-300 ${shown ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
};

export default FadeImage;
