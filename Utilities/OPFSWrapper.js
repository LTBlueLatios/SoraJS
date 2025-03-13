const OPFSState = Object.seal({
    initialised: false,
    rootDir: null
});

const OPFSWrapper = Object.freeze({
    async initialize() {
        if (OPFSState.initialised) return;

        try {
            // @ts-ignore
            OPFSState.rootDir = await navigator.storage.getDirectory();
            OPFSState.initialised = true;
        } catch (error) {
            console.error("Failed to initialize OPFS:", error);
            throw error;
        }
    },

    async ensureDirectory(path) {
        await this.initialize();

        if (!path || path === "/" || path === "") {
            return OPFSState.rootDir;
        }

        const segments = path.split("/").filter(segment => segment !== "");
        let currentDir = OPFSState.rootDir;

        for (const segment of segments) {
            try {
                // @ts-ignore
                currentDir = await currentDir.getDirectoryHandle(segment, {
                    create: true
                });
            } catch (error) {
                console.error(`Failed to access/create directory "${segment}":`, error);
                throw error;
            }
        }

        return currentDir;
    },

    parsePath(filePath) {
        const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
        const lastSlashIndex = normalizedPath.lastIndexOf("/");

        if (lastSlashIndex === -1) {
            return {
                dirPath: "",
                fileName: normalizedPath
            };
        }

        return {
            dirPath: normalizedPath.substring(0, lastSlashIndex),
            fileName: normalizedPath.substring(lastSlashIndex + 1)
        };
    },

    async setFile(filePath, contents) {
        try {
            const {
                dirPath,
                fileName
            } = this.parsePath(filePath);
            const directory = await this.ensureDirectory(dirPath);

            // @ts-ignore
            const fileHandle = await directory.getFileHandle(fileName, {
                create: true
            });
            const writable = await fileHandle.createWritable();

            await writable.write(contents);
            await writable.close();
        } catch (error) {
            console.error(`Failed to set file "${filePath}":`, error);
            throw error;
        }
    },

    async updateContents(filePath, contents) {
        try {
            const {
                dirPath,
                fileName
            } = this.parsePath(filePath);
            const directory = await this.ensureDirectory(dirPath);

            try {
                // @ts-ignore
                const fileHandle = await directory.getFileHandle(fileName);
                const writable = await fileHandle.createWritable({
                    keepExistingData: false
                });

                await writable.write(contents);
                await writable.close();
            } catch (error) {
                if (error.name === "NotFoundError") {
                    throw new Error(`File "${filePath}" not found for update.`);
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error(`Failed to update file "${filePath}":`, error);
            throw error;
        }
    },

    async getFile(filePath) {
        try {
            const {
                dirPath,
                fileName
            } = this.parsePath(filePath);
            const directory = await this.ensureDirectory(dirPath);

            // @ts-ignore
            const fileHandle = await directory.getFileHandle(fileName);
            return await fileHandle.getFile();
        } catch (error) {
            console.error(`Failed to get file "${filePath}":`, error);
            throw error;
        }
    },

    async readFile(filePath, format = "text") {
        const file = await this.getFile(filePath);

        switch (format.toLowerCase()) {
            case "text":
                return await file.text();
            case "arraybuffer":
                return await file.arrayBuffer();
            case "blob":
                return file;
            case "dataurl":
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    },

    async deleteFile(filePath) {
        try {
            const {
                dirPath,
                fileName
            } = this.parsePath(filePath);
            const directory = await this.ensureDirectory(dirPath);

            // @ts-ignore
            await directory.removeEntry(fileName);
        } catch (error) {
            console.error(`Failed to delete file "${filePath}":`, error);
            throw error;
        }
    },

    async listFiles(dirPath = "") {
        try {
            const directory = await this.ensureDirectory(dirPath);
            const entries = [];

            // @ts-ignore
            for await (const [name, entry] of directory.entries()) {
                const type = entry.kind;
                entries.push({
                    name,
                    type
                });
            }

            return entries;
        } catch (error) {
            console.error(`Failed to list files in directory "${dirPath}":`, error);
            throw error;
        }
    },

    async clearSystem() {
        await this.initialize();

        try {
            const entries = await this.listFiles();

            for (const entry of entries) {
                // @ts-ignore
                await OPFSState.rootDir.removeEntry(entry.name, {
                    recursive: true
                });
            }
        } catch (error) {
            console.error("Failed to clear file system:", error);
            throw error;
        }
    },

    async getStorageQuota() {
        return await navigator.storage.estimate();
    }
});

export default OPFSWrapper;