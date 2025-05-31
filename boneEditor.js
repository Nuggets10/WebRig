function setupBoneControls(model) {
  let skinnedMesh;

  model.traverse((child) => {
    if (child.isSkinnedMesh) {
      skinnedMesh = child;
    }
  });

  const skeleton = skinnedMesh.skeleton;
  const controlsContainer = document.getElementById("left-panel");

  skeleton.bones.forEach((bone, index) => {
    let boneName = bone.name || "Bone " + index;
    boneName = boneName.replace(/^mixamorig/, '');
    boneName = boneName.replace(/_\d{2}$/, '');
    boneName = boneName.replace(/_\d{3}$/, '');

    const boneDiv = document.createElement("div");
    boneDiv.innerHTML = `<strong>${boneName}</strong><br>`;

    ["x", "y", "z"].forEach((axis) => {
      const sliderRow = document.createElement("div");
      sliderRow.className = "slider-row";

      const label = document.createElement("label");
      label.textContent = `Scale ${axis.toUpperCase()}:`;

      const slider = document.createElement("input");
      slider.type = "range";
      slider.className = "slider";
      slider.min = "0";
      slider.max = "5";
      slider.step = "0.1";
      slider.value = bone.scale[axis];
      slider.addEventListener("input", () => {
        bone.scale[axis] = parseFloat(slider.value);
      });

      sliderRow.appendChild(label);
      sliderRow.appendChild(slider);
      boneDiv.appendChild(sliderRow);
    });

    controlsContainer.appendChild(boneDiv);
    controlsContainer.appendChild(document.createElement("hr"));
  });
}

const checkModelLoaded = setInterval(() => {
  if (window.object) {
    setupBoneControls(window.object);
    clearInterval(checkModelLoaded);
  }
}, 500);

function downloadModifiedModel() {
  const exporter = new GLTFExporter();

  exporter.parse(window.object, function (gltf) {
    const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'humanoid_rig.gltf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, { binary: false });
}
