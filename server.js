const express = require("express");
const app = express();

app.get("/req/:id", (req, res) => {
  const id = req.params.id;
  const ns = process.env.POD_NAMESPACE;
  res.json({
	id: id,
    namespace: `${ns}`
  });
});

app.listen(80, () => {
  console.log("Server running on port 80");
});
