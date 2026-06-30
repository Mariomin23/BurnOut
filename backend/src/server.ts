import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Fit-PokéAPI Server running on port ${PORT}`);
});
