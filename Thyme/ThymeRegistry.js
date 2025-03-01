const ThymeRegistry = {
    altoMare: null,
    codecs: new Map(),
    builders: new Map(),
    plugins: new Map(),

    registerSchemas(schemas) {
        if (!this.altoMare) throw new Error("AltoMare is not initialized");
        this.altoMare.register("schema", schemas);
    },
    registerCodecs(codecs) {
        codecs.forEach(codec => {
            this.codecs.set(codec.name, codec);
        });
    },
    registerBuilders(builders) {
        builders.forEach(builder => {
            this.builders.set(builder.name, builder);
        });
    },
    registerPlugins(plugins) {
        plugins.forEach(plugin => {
            this.plugins.set(plugin.name, plugin);
        });
    }
};

export default ThymeRegistry;