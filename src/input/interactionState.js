// Shared pass-aiming and ball-carrier-steering pointer state, read by both
// the renderer (to draw aim/steer overlays) and the pointer input handlers.
export const interaction={aiming:false,aimStartedAt:0,aimTarget:null,steering:false,steerAnchor:null,steerCurrent:null};
