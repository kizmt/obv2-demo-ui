import Image from 'next/image';
import React, { useState } from 'react';

const SafeImage = ({ src, alt, ...props }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    // Handle the error as you see fit: render an alternative image, a placeholder, or nothing.
    return null; // For example, don't render anything if there's an error.
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
