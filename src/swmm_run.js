Module.onRuntimeInitialized = _ => {
    const swmm_run = Module.cwrap('swmm_run', 'number', ['string', 'string', 'string']);
    data = swmm_run("data/Example1.inp", "data/Example1.rpt", "data/Example1.out")

    document.getElementById('outputDiv').html = data;

    //Get the input file for parsing:
    fetch('data/Example1.inp')
        .then(response => response.text())
        .then((data) => {
            console.log(data);

            input = new d3.inp();
            val = input.parse(data);

            console.log(val.CONDUITS[1])
        })

    fetch('data/Example1.out')
        .then(response => response.blob())
        .then((data) => {
            //console.log(data);

            input = new d3.swmmresult();
            val = input.parse('data/Example1.out');

            console.log(val);

            console.log('--------------------------')
            console.log(val[1000]);
            console.log('--------------------------')
        })

    
}
