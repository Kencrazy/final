// const { default: firebase } = require("firebase/compat/app");

const imageUpload = document.getElementById('imageUpload')
const container = document.getElementById('container')
let violators = document.getElementById('violators')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

const firebaseConfig = { 
  apiKey : "AIzaSyDshsATIzdV48PSItUv0ePHJIaB2RwAEyA" , 
  authDomain : "weatherforecast-184a2.firebaseapp.com" , 
  databaseURL : "https://weatherforecast-184a2-default-rtdb.asia-southeast1.firebasedatabase.app" , 
  projectId : "weatherforecast-184a2" , 
  storageBucket : "weatherforecast-184a2.appspot.com" , 
  messagingSenderId : "842320066215" , 
  appId : "1:842320066215:web:40d1eac20f905293640d82" , 
  measurementId : "G-17Q4Q5XKGB" 
  };
  
  
  firebase.initializeApp(firebaseConfig);
  const storage = firebase.storage()
  const db = firebase.firestore()
  
async function start() {
  
  container.style.position = 'relative'
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
  container.style.padding = 0
  container.innerHTML = ""
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)

      
      db.collection("vcop").doc(result.label).get().then((doc)=>{
        if (doc.exists) { // Check if the document exists
          const user = doc.data()
          const newDiv = document.createElement("div")
          newDiv.classList.add("violator")
          const userData = document.createElement("p")
          const data = `Họ và tên: ${user.name},<br>Địa chỉ: ${user.address},<br>Job: ${user.job},<br>CMND: ${user.id},<br>Info: ${result.label}`
          userData.innerHTML = data
          newDiv.appendChild(userData)
          violators.append(newDiv) // Append the newDiv to violators
        } else {
          console.log("No such document!");
        }
      })
    })
  })
}

function loadLabeledImages() {
  const labels = ['Sy0p3kRuE9Q9cu05RywV8KuJfAs2', 'dSDb8wot9mdB6OUwohja7maO0Uc2', 'kQM76I4VHhTr9HicMmni8fMMwH42']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/Kencrazy/face/main/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
