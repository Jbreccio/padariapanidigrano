import express from "express"
import path from "path"
import fs from "fs"

const router = express.Router()

function getMisterioByDay() {
  const day = new Date().getDay()

  const mapa = {
    0: "gloriosos",
    1: "gozosos",
    2: "dolorosos",
    3: "gloriosos",
    4: "luminosos",
    5: "dolorosos",
    6: "gozosos"
  }

  return mapa[day]
}

router.get("/hoje", (req, res) => {
  const misterio = getMisterioByDay()

  res.json({
    titulo: `Mistérios ${misterio}`,
    audio: `/audios/${misterio}.mp3`,
    sincronismo: `/sync/${misterio}.json`,
    tipo: misterio
  })
})

export default router