import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'

// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-analytics.js'

// Add Firebase products that you want to use
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js'

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
    const divsidebar = document.getElementById('sidebar')
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
    const productsToAdd = [{
        naam: "Maxi Cosi autostoel",
        beschrijving: "AxissFix i-Size",
        prijs: 259,
        status: 0,
        image: "https://media.s-bol.com/qL6nqBjzxx7R/k2Oo0KJ/1200x950.jpg",
        link: "https://www.bol.com/be/nl/p/maxi-cosi-axissfix-i-size-autostoeltje-360-draaibaar-authentic-graphite/9200000129156867/?bltgh=kT4-qP2mog1mt7sIBGZK8g.2_53.54.ProductImage"
    } , {
        naam: "Kinderstoel",
        beschrijving: "Comfortabel mee aan tafel",
        prijs: 119,
        status: 0,
        image: "https://media.s-bol.com/m24PAmxwQ5xA/DRrRovK/1200x1200.jpg"
    } , {
        naam: "Babyfoon",
        beschrijving: "Altijd dichtbij",
        prijs: 80,
        status: 0,
        image: "https://media.s-bol.com/VoJxB7LXzPEW/p8AkMwQ/1200x712.jpg"
    }, {
        naam: "Kinderwagen Maxi Cosi",
        beschrijving: "Samen op avontuur",
        prijs: 200,
        status: 0,
        image: "https://media.s-bol.com/mZRp2vnnKgWn/821x1200.jpg"
    } , {
        naam: "Matras voor bedje",
        beschrijving: "Voor een heerlijk rustige nacht",
        prijs: 60,
        status: 0,
        image: "https://static.dreambaby.be/wcsstore/ColruytB2CCAS/JPG/JPG/646x1000/std.lang.all/38/50/asset-1413850.jpg"
    }]

    const txtBeschReserveer = document.getElementById("reserveerBeschrijving")
    const textBeschrijvingReserveerStap1Nieuw = "Met onderstaande knop kan je het product bekijken op een webshop om te kopen. Kom je graag je geschenk persoonlijk afgeven? Laat het dan bij jou thuis leveren. Of stuur het rechtstreeks naar ons huisadres: Paddestraat 84 - 9620 Zottegem."
    const textBeschrijvingReserveerStap1Oud = "Dit product hebben mijn ouders reeds zelf gekocht omdat we het nu al gebruiken. Indien je wilt bijleggen voor dit artikel kan dit steeds door een bijdrage te storten op mijn rekening BE30 0829 1344 7711."

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
            querySnapshot.forEach( async (d) => {
                
                let already_added = false
                let should_be_removed = false

                /*for(let p in products){
                    console.log(p)
                    if(products[p].naam === d.data().naam){
                        already_added = true
                        break    
                    }
                }

                for(let p of productsToAdd){
                    if(p.naam === d.data().naam){
                        should_be_removed = true
                        break    
                    }
                }*/

                products[d.id] = d.data()

                if(already_added && should_be_removed){
                    await deleteDoc(doc(db, "producten", d.id));
                } else {
                    renderProduct(d.id, d.data())
                }
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
        card.classList.add("col-12", "col-lg-6", "col-xxl-4", "my-3")
        card.dataset.productRef = id
        card.innerHTML = `  <div class="custom-card card p-3 h-100 justify-text-center text-center">
                                <img class="card-img-top img-fluid" src="${data.image}"  loading="lazy" >
                                <div class="card-body">
                                    <h4 class="card-title">${data.naam}</h4>
                                    <p class="card-text">${data.beschrijving}</p>
                                    <button type="button" class="btn" style="background-color: buttonface; pointer-events: none;"> ${data.prijs} euro</button>
                                </div>
                            </div>
                        `
        card.addEventListener('click',reserveer)
        if(data.link){
            newProductList.appendChild(card)
        } else {
            oldProductList.appendChild(card)
        }
    }

    function renderReservedElement(id){
        let data = products[id]

        data.beschrijving = data.beschrijving || ""

        //console.log(data)
        const card = document.createElement('div')
        card.classList.add("col-12", "col-xl-4", "my-3")
        card.dataset.productRef = id
        card.innerHTML = `  <div class="card p-3 h-100 justify-text-center text-center">
                                <img class="card-img-top img-fluid" src="${data.image}"  loading="lazy" >
                                <div class="card-body">
                                    <h4 class="card-title">${data.naam}</h4>
                                    <p class="card-text">${data.beschrijving}</p>
                                    <button type="button" class="btn" style="background-color: buttonface; pointer-events: none;"> ${data.prijs} euro</button>
                                </div>
                            </div>
                        `
        
        return card
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
        detailedProductCard.prepend(renderReservedElement(currentProduct))

        // set text of beschrijving
        if(products[currentProduct].link){
            txtBeschReserveer.innerText = textBeschrijvingReserveerStap1Nieuw
        } else {
            txtBeschReserveer.innerText = textBeschrijvingReserveerStap1Oud
        }


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

        //hide intro on small screens
        if(window.innerWidth < 576){
            sidebar.style.display = 'none'
        }
        
        div_producten.style.display = 'none'
        div_reserveer.style.display = 'block'
    }

    async function reserveerToProducten(event){
        await unreserveProduct(currentProduct)

        loadProducts();
        sidebar.style.display = 'block'
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
        sidebar.style.display = 'block'
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
        for(let p of productsToAdd){
            console.log(p)
            await addDoc(collection(db, "producten"), p);
        }
    }
}