import mongoose, { Schema, Document } from 'mongoose';

interface Image extends Document {
  url: string;
  name : string
}

const imageSchema = new Schema<Image>({
  url : {
    type: String,
    required: true,
  },
  name : {
    type: String,
    required: true,
  },
});

const Image = mongoose.models.Image || mongoose.model<Image>('Image', imageSchema);

export default Image;