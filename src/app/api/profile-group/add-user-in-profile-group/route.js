import { ProfileGroup  } from "../../../../lib/models/ProfileGroup.js";
import { NextResponse } from "next/server.js";
import { connectToDb } from "@/app/api/mongo/index.js";
export const POST = async (req, res) => {
  await connectToDb();
  const { user_id ,profile_id } = await req.json();
  //console.log('user_id',user_id);
  //console.log('profile_id',profile_id);
    
  try {
       // สร้างเอกสาร
        
       const _ProfileGroup=await ProfileGroup.findById(profile_id);
       //console.log("_ProfileGroup before save",_ProfileGroup);
       if(_ProfileGroup){
           const exists = _ProfileGroup.USER_LIST.some(id => id.equals(user_id));
           if(!exists){
                _ProfileGroup.USER_LIST.push(user_id);
                await _ProfileGroup.save();
                //console.log('Save OK');    
           }else{
                //console.log('No Save because is duplicate!');    
           }     
       }
           
      return NextResponse.json({ status: 200,result:_ProfileGroup } );
  } catch (error) {
    return NextResponse.json({
      status: 500,
      file: __filename,
      error: error.message,
    });
  }
};
