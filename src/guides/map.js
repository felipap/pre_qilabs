
module.exports =  {
	vestibular: {
		color: "red",
		file: "text/vestibular/main.md",
		children: {
			"exames-unificados": {
				file: "text/vestibular/exames-unificados.md",
				children: {
					"enem": {
						file: "text/vestibular/exames-unificados-enem.md",
					}
				}
			}
		}
	}
}