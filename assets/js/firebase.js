import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'

// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-analytics.js'

// Add Firebase products that you want to use
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
import { getFirestore, collection, doc, getDocs, setDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js'

const firebaseConfig = {
	apiKey: "AIzaSyDtUQ85JVTm9Q7KIdJBXDrJqEyqBkP54dQ",
	authDomain: "geboortelijst-262cf.firebaseapp.com",
	projectId: "geboortelijst-262cf",
	storageBucket: "geboortelijst-262cf.appspot.com",
	messagingSenderId: "476696767686",
	appId: "1:476696767686:web:c1aa713eb90923c8f8fbc7"
};

window.onload = function() {

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    let db = null
    let user = null

    //document elements used by script TODO-change these to the correct ones
    let input_pass = document.getElementById('txtPass')
    let btn_login = document.getElementById('btnLogin')
    btn_login.addEventListener('click', login)
    let div_login = document.getElementById('divLogin')
    let div_content = document.getElementById('divContent')
    let div_producten = document.getElementById('divProducten')
    let newProductList = document.getElementById('newProductList')
    let oldProductList = document.getElementById('oldProductList')
    let div_reserveer = document.getElementById('divReserveerProduct')
    let detailedProductCard = document.getElementById('detailProductInfo')
    let div_gekocht = document.getElementById('divProductGekocht')
    let minuteTimesReserved = 5
    let linkBackReserved = document.getElementById('reservedToProducten')
    linkBackReserved.addEventListener('click', reserveerToProducten)
    let linkBackGekocht = document.getElementById('gekochtToProducten')
    linkBackGekocht.addEventListener('click', gekochtToProducten)
     let btnGekocht = document.getElementById('btnGekocht')
    btnGekocht.addEventListener('click', gekocht)
    const txtGekochtNaam = document.getElementById('txtGekochtNaam')
    const txtGekochtBericht = document.getElementById('txtGekochtBericht')
    let currentProduct = undefined
    let products = {}

    async function login(){
        try{
            //TODO change password
            user = await signInWithEmailAndPassword(auth, 'jensbaetens1@gmail.com', input_pass.value)
            if(user){
                user = user.userCredential
                localStorage.setItem("pass", input_pass.value);
                console.log('correctly logged in')
                div_login.style.display = "none"
                div_content.style.display = 'block'
                db = getFirestore(app);
                //await addProducten()
                await loadProducts()
            }
        } catch(error) {
            console.log(error)
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorMessage)
            localStorage.removeItem("pass");
        }

    }

    async function loadProducts(){
        try{
            console.log('load products')
            newProductList.innerHTML = ''
            oldProductList.innerHTML = ''
            const querySnapshot = await getDocs(collection(db, "producten"));
            querySnapshot.forEach((doc) => {
                products[doc.id] = doc.data()
                renderProduct(doc.id, doc.data())
            });
            console.log('loading done')
        } catch(error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorMessage)
        }
    }

    function renderProduct(id, data){
        if(data.link && data.status == 2){
            return
        } else if (data.link && data.status ==1){
            if(data.reservedUntil < Date.now()){
                unreserveProduct(id);
                data.status = 0
            } else {
                return
            }
        }

        data.beschrijving = data.beschrijving || ""

        //console.log(data)
        const card = document.createElement('div')
        card.classList.add("card", "col", "col-product", "medium-2", "small-12", "large-2")
        card.dataset.productRef = id
        card.innerHTML = `
                    <div class="col-inner"><div class="is-border card-border"></div>
                    <div class="box has-hover has-hover box-text-bottom">
                        <div class="box-image">
                            <img class="img-product" src="${data.image}"  loading="lazy" >
                        </div>
                        <div class="box-text text-center">
                            <div class="box-text-inner">
                                <h4 style="font-size: 15px;">${data.naam}</h4>
                                <p style="color:#334862">${data.beschrijving}</p>
                                <button type="button" class="btn btn-outline-warning" style="pointer-events: none;"> ${data.prijs} euro</button>
                            </div>
                        </div>
                    </div>`
        card.addEventListener('click',reserveer)
        if(data.link){
            newProductList.appendChild(card)
        } else {
            oldProductList.appendChild(card)
        }
    }

    function reserveer(event){
        currentProduct = event.currentTarget.dataset.productRef
        const productRef = doc(db, 'producten', currentProduct);
        const reservedUntil = Date.now() + minuteTimesReserved * 60 * 1000
        setDoc(productRef, { status: 1, gereserveerdTot: reservedUntil }, { merge: true });

        // move product card
        if(detailedProductCard.childElementCount>1){
            detailedProductCard.removeChild(detailedProductCard.firstElementChild);
        }
        event.currentTarget.style.marginLeft = 'auto'
        event.currentTarget.style.paddingRight = '25px['
        detailedProductCard.prepend(event.currentTarget)


        //hide stuff in case of old product
        if(products[currentProduct].link){
            detailedProductCard.querySelector('#check').style.display='block'
            detailedProductCard.querySelector('#btnGekocht').disabled = true
                
            const linkWebshop = detailedProductCard.querySelector('.linkWebshop')
            linkWebshop.style.display='block'
            linkWebshop.href = products[currentProduct].link
        } else {
            detailedProductCard.querySelector('#check').style.display='none'
            detailedProductCard.querySelector('#btnGekocht').disabled = false
            detailedProductCard.querySelector('.linkWebshop').style.display='none'
        }
        
        div_producten.style.display = 'none'
        div_reserveer.style.display = 'block'
    }

    async function reserveerToProducten(event){
        await unreserveProduct(currentProduct)

        loadProducts();
        div_producten.style.display = 'block'
        div_reserveer.style.display = 'none'
    }

    async function unreserveProduct(id){
        const productRef = doc(db, 'producten', id);
        await setDoc(productRef, { status: 0 }, { merge: true });
    }

    window.addEventListener("beforeunload", function(event) {
        if(currentProduct){
            unreserveProduct(currentProduct)
        }
    });

    function gekochtToProducten(event){
        loadProducts()
        div_content.style.display = 'block'
        div_producten.style.display = 'block'
        div_reserveer.style.display = 'none'
        div_gekocht.style.display = 'none'
    }

    document.getElementById('gekochtCheck').addEventListener('click', (event) => {
        btnGekocht.disabled = !event.target.checked
    })

    async function gekocht(event){
        //set state of product to gekocht
        const productRef = doc(db, 'producten', currentProduct);
        await setDoc(productRef, { status: 2}, { merge: true });
        
        // bewaar persoonlijk bericht
        await addDoc(collection(db, "berichten"), {
            name: txtGekochtNaam.value,
            bericht: txtGekochtBericht.value,
            gekochtProduct: productRef,
            naam: products[currentProduct].naam,
            prijs: products[currentProduct].prijs
        });

        currentProduct = undefined
        div_content.style.display = 'none'
        div_gekocht.style.display = 'block'
    }

    if (localStorage.pass) {
        input_pass.value = localStorage.pass
        login()
    }

    async function addProducten(){
        const products = [{
            naam: "traphekje",
            beschrijving: "om mijn avontuurlijke zelf in te perken",
            prijs: 69.9,
            status: 0,
            image: "https://firebasestorage.googleapis.com/v0/b/geboortelijst-262cf.appspot.com/o/traphekje.png?alt=media&token=aec981b6-ff84-46dd-aab3-0ec50d42987c",
            link: "https://www.bol.com/be/nl/p/clear-step-autoclose-2-set-9-cm-dark-grey-deurhekje-met-verlengstuk-van-9-cm-84-89-cm-zeer-lage-dorpel-automatisch-sluitmechanisme-zonder-te-boren-metaal-donkergrijs/9300000139536049/?bltgh=iwD96LYcqv7r6kVRDAFFOQ.3_15.23.ProductImage"
        }
        ]

        for(let p of products){
            console.log(p)
            await addDoc(collection(db, "producten"), p);
        }
    }
}