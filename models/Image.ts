import mongoose, { Schema, Document } from 'mongoose';

interface ImageURL extends Document {
  url: string;
  name : string
}

const imageUrlSchema = new Schema<ImageURL>({
  url : {
    type: String,
    required: true,
  },
  name : {
    type: String,
    required: true,
  },
});

const ImageURL = mongoose.models.ImageURL || mongoose.model<ImageURL>('ImageURL', imageUrlSchema);

export default ImageURL;