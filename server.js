const express = require("express");
const app = express();

app.get("/req/:id", (req, res) => {
  const id = req.params.id;
  res.json({
    id,
    name: `Provider response for ${id}`
  });
});

app.listen(80, () => {
  console.log("Server running on port 80");
});
