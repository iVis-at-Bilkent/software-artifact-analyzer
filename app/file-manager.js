export default class FileManager {
    constructor(appManager){
        this.appManager = appManager;
    }

    init(){
        $('#load-btn').on('click', () => this.loadFile());
    }

    loadFile(){

        const fileInput = $('#file-input');
        fileInput.click();
        fileInput.on('change', event => {
            if(!event.target || !event.target.files){
                console.log('Something went wrong while loading the file :(');
                return;
            }

            const file = event.target.files[0];
            const fileReader = new FileReader();
            fileReader.onload = () => {
                this.appManager.loadFile(fileReader.result);
            };
            fileReader.onerror = (error) => {
                console.error('File could not be read!', error);
                fileReader.abort();
            };
            fileReader.readAsText(file);
        });
    }
}