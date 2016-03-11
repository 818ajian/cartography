

var w = window.innerWidth;
var h = window.innerHeight;
var scene, camera, renderer, mesh, group, target, start = 0;
var mat, depth,tex_map,tex_ele;


var proxy = "../proxy.php?url=";
var domains = "01,02,03,04".split( ',' );

var provider = proxy + "http://ttiles{s}.mqcdn.com/tiles/1.0.0/vy/sat/{z}/{x}/{y}.png";
var ele_provider = proxy + "http://elasticterrain.xyz/data/tiles/{z}/{x}/{y}.png";

var size = 1024;
var map = new Map( provider, domains, size * 2, size * 2, 4, 11 );
var ele = new Map( ele_provider, [], size, size,4,10 );

////Nevada,Chile-N,
var lat = -26.48;
var lng = -68.58;
var zl  = 12;
var sl = new ShaderLoader();
sl.loadShaders( {
    depth_fs:"",
    depth_vs:"",
    map_fs:"",
    map_vs:"",
    fx_fs:""
}, "glsl/", onShadersLoaded );

function onShadersLoaded() {


    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, w / h, 10, 1500 );
    camera.position.y = 350;
    camera.position.z = 1100;

    new THREE.OrbitControls(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);

    document.body.appendChild(renderer.domElement);

    map.eventEmitter.on( Map.ON_TEXTURE_UPDATE, onTextureUpdate );
    ele.eventEmitter.on( Map.ON_TEXTURE_UPDATE, onTextureUpdate );

    //controls.add( map );
    //controls.add( ele );
    //controls.addListeners(renderer.domElement);

    tex_map = new THREE.Texture( map.canvas, null, THREE.wrapS, THREE.wrapT, THREE.LinearFilter, THREE.LinearFilter  );
    tex_ele = new THREE.Texture( ele.canvas, null, THREE.wrapS, THREE.wrapT, THREE.LinearFilter, THREE.LinearFilter  );

    PostPrcessing.init( w,h, scene, camera, renderer );

    mat = new THREE.ShaderMaterial({
        uniforms: {
            map: {type: "t", value: tex_map },
            ele: {type: "t", value: tex_ele },
            nearFar: {type: "v2", value: new THREE.Vector2(camera.near, camera.far) },
            scale: {type: "f", value: 0 },
            time: {type: "f", value: 0 },
            heroic: {type: "f", value: 0 }
        },
        vertexShader: ShaderLoader.get("map_vs"),
        fragmentShader: ShaderLoader.get("map_fs"),
        side: THREE.DoubleSide,
        transparent:true
    });

    depth = new THREE.ShaderMaterial({
        uniforms: {
            ele: {type: "t", value: tex_ele },
            nearFar: {type: "v2", value: new THREE.Vector2(camera.near, camera.far) },
            scale: {type: "f", value: 5 },
            heroic: {type: "f", value: 1 }

        },
        vertexShader: ShaderLoader.get("map_vs"),
        fragmentShader: ShaderLoader.get("depth_fs"),
        side: THREE.DoubleSide,
        transparent:true
    });

    PostPrcessing.depthMaterial = depth;

    group = new THREE.Group();

    var geom = new THREE.PlaneBufferGeometry( 1024,1024, 512,512);
    mesh = new THREE.Mesh( geom, mat );
    mesh.rotateX( -Math.PI/2 );
    group.add(mesh);
    scene.add( group );

    ele.setView( lat, lng, 10 );
    map.setView( lat, lng, 10 );

    target = new THREE.Vector3(0,-350,0);
    start = Date.now();
    update();

    //dropdown list
    var selector = document.createElement( 'select' );

    var volcanoes = "Arhab,Arabia-S,15.63,44.08, Atuel,Argentina,-34.65,-70.05, Auquihuato,Perú,-15.07,-73.18, Azufre,Chile-N,-21.79,-68.24, Azul,Galápagos,-0.92,-91.41, Azul,Chile-C,-35.65,-70.76, Barrier,Africa-E,2.32,36.57, Bayo,Chile-N,-25.42,-68.58, Blancas,Chile-C,-36.29,-71.01, Casiri,Perú,-17.47,-69.81, Chachani,Perú,-16.19,-71.53, Chichón,México,17.36,-93.23, Chillán,Chile-C,-36.86,-71.38, Cochons,Indian O.-S,-46.1,50.23, Cóndor,Argentina,-26.62,-68.35, Cumbres,México,19.15,-97.27, Dhamar,Arabia-S,14.57,44.67, Druze,Syria,32.66,36.43, Escorial,Chile-N,-25.08,-68.37, Est,Indian O.-S,-46.43,52.2, Fournaise,Indian O.-W,-21.23,55.71, Gloria,México,19.33,-97.25, Harrah,Arabia-W,31.08,38.42, Haylan,Arabia-S,15.43,44.78, Humeros,México,19.68,-97.45, Incahuasi,Chile-N,-27.04,-68.28, Ithnayn,Arabia-W,26.58,40.2, Jayu Khota,Bolivia,-19.45,-67.42, Khaybar,Arabia-W,25,39.92, Koussi,Africa-N,19.8,18.53, Lengai,Africa-E,-2.76,35.91, Longaví,Chile-C,-36.19,-71.16, Lunayyir,Arabia-W,25.17,37.75, Malinche,México,19.23,-98.03, Marra,Africa-N,12.95,24.27, Maule,Chile-C,-36.02,-70.58, Misti,Perú,-16.29,-71.41, Negrillar,Chile-N,-24.28,-68.6, Nevada,Chile-N,-26.48,-68.58, Nicholson,Perú,-16.26,-71.73, Ojos del Salado,Chile-N,-27.12,-68.55, Orizaba,México,19.03,-97.27, Pantoja,Chile-C,-40.77,-71.95, Possession,Indian O.-S,-46.42,51.75, Quill,W Indies,17.48,-62.96, Rahah,Arabia-W,27.8,36.17, Rahat,Arabia-W,23.08,39.78, Sawâd,Arabia-S,13.58,46.12, Solo,Chile-N,-27.11,-68.72, Telong,Sumatra,4.77,96.82, Tigre,Honduras,13.27,-87.64, Tôh,Africa-N,21.33,16.33, Toluca,México,19.11,-99.76, Toussidé,Africa-N,21.03,16.45, Tujle,Chile-N,-23.83,-67.95, Tuzgle,Argentina,-24.05,-66.48, 'Uwayrid,Arabia-W,27.08,37.25, Voon,Africa-N,20.92,17.28, Zacate Grande,Honduras,13.33,-87.63";
    var list = volcanoes.split(',');

    for( var  i = 0; i < list.length; i+= 4 ){
        var opt = document.createElement('option');
        opt.value = opt.innerHTML = list[i];
        opt.setAttribute( 'lat', list[i+2]);
        opt.setAttribute( 'lng', list[i+3]);
        selector.appendChild( opt );
    }

    selector.addEventListener( 'change', function(e){
        var selection = selector.options[selector.selectedIndex];
        goto( parseFloat(  selection.getAttribute('lat') ), parseFloat(selection.getAttribute('lng') ) );
    } );
    document.body.appendChild(selector);
    selector.style.zIndex = 10;
}

function goto( lat, lng ){

    ele.setView( lat, lng );
    map.setView( lat, lng );
}

window.onresize = function(e)
{
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize( w,h );
    camera.aspect = w/h;

    PostPrcessing.resize(w,h);

    camera.updateProjectionMatrix();
};
function onTextureUpdate()
{
    tex_map.needsUpdate = true;
    tex_ele.needsUpdate = true;
}

function update(){

    requestAnimationFrame(update);
    map.setView( ele.latitude, ele.longitude, ele.zoom + 1 );

    mat.uniforms.time.value  = ( Date.now() - start ) * .001;

    mat.uniforms.heroic.value = depth.uniforms.heroic.value = 0;

    mat.uniforms.scale.value =
    depth.uniforms.scale.value = 1 / map.resolution( Math.min( map.maxZoom-1, map.zoom ) ) * 3;
    //camera.lookAt( target );

    PostPrcessing.render();

}