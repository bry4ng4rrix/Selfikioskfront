import {React ,useEffect ,useState} from 'react'
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const login = () => {
    const [email,setEmail] = useState()
    const [password,setPassword] = useState()
    const navigate = useNavigate();
const Login = async () => {
    
    console.log(email,password)
    toast.dismiss()
if (!email || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log(result.access_token)

      if (response.ok) {
        localStorage.setItem('token', result.access_token);
        toast.success('Connexion réussie !');
        setTimeout(() => {
         navigate('/admin');
        }, 2000);

      } else {
        // Vérifier si c'est une erreur de serializer
        if (result.non_field_errors) {
          toast.error(result.non_field_errors[0]);
        }
      }
    } catch (error) {
      toast.error('Erreur réseau ou serveur indisponible.');
    }
}

  return (
    <div className='h-screen w-screen  flex justify-center items-center p-5'>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        theme="light"
        pauseOnHover
        transition={Bounce}
      />
      <div className='bg-white  w-1/2 h-4/3 m-3  p-5 rounded-xl shadow-lg'>
        <div className="flex flex-col items-center justify-between h-full">
         

            <div className="text-center">
              <h1 className="text-2xl font-bold m-2">Bienvenue au Kiosque Selfie</h1> 
                <div className="text-center text-gray-600 m-2">
               Page de connexion pour L'administrateur
                </div>  
                
            </div>
            <div className='flex flex-col  w-3/4 h-3/4 justify-center '>
                <label htmlFor="email" className='m-2 '>Email</label>
                <input type="email" className='border rounded-lg h-3 p-5 w-full' onChange={(e) => setEmail(e.target.value)}/>
                <label htmlFor="password" className='m-2 '>Mot de passe</label>
                <input type="password" className='border rounded-lg h-3 p-5'onChange={(e) => setPassword(e.target.value)}/>
                <button className='bg-blue-500  text-white hover:bg-blue-800 p-3 my-10 w-full rounded-lg' 
                onClick={Login}
                >Se connecter</button>
            </div>
             
            <div>
              <ul className="list-disc text-gray-600">
                <li>Gratuit et instantané</li>
                <li>Fonds personnalisés disponibles</li>
                <li>Envoi par SMS ou email</li>
              </ul>
            </div>


        </div>
      </div>
    </div>
  )
}

export default login
