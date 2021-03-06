<?php
// DEFAULT STUFF
namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

// LIBRARIES
use Hash;
use Auth;
use Mailgun\Mailgun;
use Mail;

// MODELS
use App\User;
use App\Models\Blueprint;

class Users extends Controller
{
  //
  // [ U S E R   L I S T ]
  //
  //
  public function index(){
    $user   = Auth::user();
    $admins = User::where("level", 3)->get(); 
    $users  = User::where("level", 2)->get(); 

    $data = [];
    $data['title']       = 'Admins Tú Evalúas';
    $data['description'] = '';
    $data['body_class']  = 'users';
    $data['user']        = $user;
    $data['users']       = $users;
    $data['admins']      = $admins;
    $data['status']      = session('status');

    return view("users")->with($data);
  }

  //
  // [ C R E A T E   U S E R ]
  //
  //
  public function store(Request $request){
    $u = Auth::user();
    if($u->level != 3) return redirect("dashboard/usuarios");
    // fix posible trail spaces on the email
    $email = trim($request->input('email'));
    $request->merge(['email' => $email]);

    $messages = [
      'name.required'     => 'Debes escribir el nombre del usuario',
      'name.max'          => 'El nombre es muuuuuuy largo :/',
      'email.required'    => 'Debes escribir el correo del usuario',
      'email'             => 'El correo debe tener un formato válido',
      'email.unique'      => 'Ese correo ya está en uso',
      'email.max'         => 'Ese correo seguro no existe...',
      'password.required' => 'Debes escribir el password del usuario',
      'password.min'      => 'El password debe tener por lo menos 8 caracteres',
    ];

    // validate the user
    $this->validate($request, [
      
      'name'     => 'required|max:255',
      'email'    => 'required|email|unique:users|max:255',
      'password' => 'required|min:8',
      
    ], $messages);

    $user = new User();
    $user->name     = $request->name;
    $user->email    = $request->email;
    $user->password = Hash::make($request->password);
    $user->level    = $request->level;
    $user->branch   = $request->branch;
    $user->unit     = $request->unit;
    $user->save();


    Mail::send('email.welcome', ['user' => $user], function ($m) use ($user) {
      $m->from('howdy@tuevaluas.com.mx', 'Tú evalúas');
      $m->to($user->email, "amigo")->subject('Invitación a utilizar tú evalúas!');
    });


    $request->session()->flash('status', ['type' => 'create', 'name' => $user->name]);
    return redirect("dashboard/usuario/" . $user->id);
  }

  //
  // [ U P D A T E   U S E R   F O R M ]
  //
  //
  public function update($id = false){
    $user  = Auth::user();
    $_user = User::find($id);

    $data                = [];
    $data['user']        = $user;
    $data['_user']       = $_user;
    $data['title']       = 'Editar Usuario';
    $data['description'] = '';
    $data['body_class']  = 'users';

    return view("user")->with($data);
  }

  //
  // [ U P D A T E   U S E R ]
  //
  //
  public function change(Request $request, $id = false){
    $user  = User::find($id);
    $rules = ['name' => 'required|max:255'];
    $pass  = trim($request->input('password'));
    if(!empty($pass)) $rules['password'] ='required|min:8';

    $this->validate($request, $rules);

    $user->name   = $request->name;
    $user->branch = $request->branch;
    $user->unit   = $request->unit;
    if(!empty($pass)) $user->password = Hash::make($request->password);

    if($user->level == 3) $user->level = empty($user->level) || empty($request->level) ? 2 : $request->level;

    $user->update();
    $request->session()->flash('status', ['type' => 'update', 'name' => $user->name]);
    return redirect("dashboard/usuarios");
  }

  //
  // [ DELETE USER ]
  //
  //
  public function delete(Request $request, $id){
    $user = Auth::user();
    if(! $user->level == 3 || $user->id == $id){
      return redirect("dashboard/usuarios"); 
    }

    $kenny = User::find($id);
    $title = $kenny->email;
    $kenny->delete();

    $request->session()->flash('status', ['type' => 'delete', 'name' => $title]);
    return redirect('dashboard/usuarios');
  }

  //
  // [ S E A R C H ]
  //
  //
  public function search(Request $request){
    $query = $request->input("query");
    $response = User::where("email", "like", "%{$query}%")->orWhere("name", "like", "%{$query}%")->get();
    return response()->json($response)->header('Access-Control-Allow-Origin', '*');
  }
}
