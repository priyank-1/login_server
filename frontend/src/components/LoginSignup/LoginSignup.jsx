import React, { useState } from 'react';
import './LoginSignup.css';
import user_icon from './../../Assets/person.png';
import email_icon from './../../Assets/email.png';
import password_icon from './../../Assets/password.png';
import dob_icon from './../../Assets/calendar.png'

const LoginSignup = () => {

    const[action ,setAction]= useState("Sign Up");

    const [user,setUser]  = useState({
        Name:"",email:"",DateofBirth:"",password:""
    });

    const {email,password}=user;
    const changeHandler = e => {
        setUser({...user,[e.target.name]:[e.target.value]});
      }
      const submitHandler = e => {
        e.preventDefault();
        console.log(user);
      }

      

  return (
    <div className='container'>
        <div  className='header'>
            <div className='text'>{action}</div>
            <div className="underline"></div>
        </div>
       <div className='inputs'>
        {action==="Login"?<div></div>:<div className='input'>
            <img src={user_icon} alt=""/>
            <input type="text" placeholder='Name' name='Name' onChange={changeHandler}/>
        </div>}

        {action==="Login"?<div></div>:<div className='input'>
            <img src={dob_icon} alt=""/>
            <input type="Date" placeholder='DateofBirth' name='DateofBirth' onChange={changeHandler}/>
        </div>
        }
        
            <div className='input'>
            <img src={email_icon} alt=""/>
            <input type="email" placeholder='Email' name='email' value={email} onChange={changeHandler}/>
            </div>
            <div className='input'>
            <img src={password_icon} alt=""/>
            <input type="password" placeholder='Password' name='password' value={password} onChange={changeHandler}/>
        </div>

        

        {action==="Sign Up"?<div></div>:
        <div className="forgot-password">Forgot Password?<span>Click Here!</span></div>
        }

        

        <div className="submit-container">
            <div className={action==="Login"?"submit gray":"submit"} onClick={()=>{setAction("Sign Up")}} onSubmit={submitHandler}>Sign Up</div>
            <div className={action==="Sign Up"?"submit gray":"submit"} onClick={()=>{
                setAction("Login")
            }} onSubmit={submitHandler}>Login</div>
        </div>
       
    </div>
    </div>
  )
}

export default LoginSignup
