import React, { useContext } from 'react'
import { Link, useNavigate  } from "react-router-dom"
import { assets } from '../assets/assets'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const { openSignIn } = useClerk()
  const { user } = useUser()

  const navigate = useNavigate()

  const { setShowRecruiterLogin, recruiter } = useContext(AppContext)

  return (
    <div className='shadow-md w-full fixed top-0 left-0 bg-white px-4 py-2 flex justify-between items-center z-[999]'>
      <div className='container mx-auto flex justify-between items-center'>
        {/* Only navigate to home on logo click if NOT a recruiter */}
        <img onClick={()=> !recruiter && navigate('/')} className={recruiter ? 'cursor-default' : 'cursor-pointer'} src={assets.logo} alt="" />
        {
          user
            ? <div className='flex items-center gap-3'>
                <Link to={'/applications'}>Applied Jobs</Link>
                <p>|</p>
                <p className='max-sm:hidden'>Hi, {user.firstName+" "+user.lastName}</p>
                <UserButton />
            </div>
            : <div className='flex gap-4 max-sm:text-xs'>
              <button onClick={() => setShowRecruiterLogin(true)} className='text-gray-600 hover:text-blue-600 transition-colors'>Recruiter Login</button>
              <button onClick={() => openSignIn()} className='bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-9 py-2 rounded-full transition-colors'>Login</button>
            </div>
        }

      </div>
    </div>
  )
}

export default Navbar

















// import React from "react";
// import { assets } from "../assets/assets";
// import {
//   SignedIn,
//   SignedOut,
//   UserButton,
//   useClerk
// } from "@clerk/clerk-react";

// const Navbar = () => {
//   const { openSignIn } = useClerk();

//   return (
//     <header className="shadow-md w-full fixed top-0 left-0 bg-white px-4 py-2">
//       <div className="container mx-auto flex justify-between items-center">
//         <img src={assets.logo} alt="logo" className="h-10" />

//         <div className="flex items-center gap-4">
//           {/* When user is NOT signed in: show recruiter + sign in */}
//           <SignedOut>
//             <button className="text-gray-600">Recruiter Login</button>
//             <button
//               onClick={() => openSignIn({})}
//               className="bg-blue-600 text-white px-6 sm:px-9 py-2 rounded-full"
//             >
//               Login
//             </button>
//           </SignedOut>

//           {/* When user IS signed in: show profile UserButton */}
//           <SignedIn>
//             <UserButton afterSignOutUrl="/" />
//           </SignedIn>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Navbar;

