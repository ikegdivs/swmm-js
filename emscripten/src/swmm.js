Module.onRuntimeInitialized = _ => {
    const swmm_run = Module.cwrap('swmm_run', 'number', ['string', 'string', 'string']);
    data = swmm_run("data/Example1.inp", "data/Example1.rpt", "data/Example1.out")

    document.getElementById('outputDiv').html = data;
}