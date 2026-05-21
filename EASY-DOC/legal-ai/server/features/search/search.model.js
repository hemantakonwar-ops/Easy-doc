import mongoose from 'mongoose';

const searchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  documentId: { type: String },
  results: [{
    text: { type: String },
    score: { type: Number },
  }],
  searchedAt: { type: Date, default: Date.now },
});

export const Search = mongoose.model('Search', searchSchema);
export default Search;
