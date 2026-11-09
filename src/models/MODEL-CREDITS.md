# Models

## Default Models in Human Library

Default models in Human library are:

- **Face Detection**: MediaPipe BlazeFace Back variation
- **Face Mesh**: MediaPipe FaceMesh
- **Face Iris Analysis**: MediaPipe Iris
- **Face Description**: HSE FaceRes
- **Emotion Detection**: Oarriaga Emotion
- **Body Analysis**: MoveNet Lightning variation
- **Hand Analysis**: HandTrack combined with MediaPipe Hands
- **Object Detection**: MB3 CenterNet (not enabled by default)
- **Body Segmentation**: Google Selfie (not enabled by default)
- **Face Anti-Spoofing**: Real-or-Fake (not enabled by default)
- **Face Live Detection**: Liveness (not enabled by default)

<br>

## Optional Models in Human Library

`Human` includes default models but supports number of additional models and model variations of existing models  

Additional models can be accessed via:

- [GitHub repository](https://github.com/vladmandic/human-models)
- [NPMjs package](https://www.npmjs.com/package/@vladmandic/human-models)

To use alternative models from local host:

- download them either from *github* or *npmjs* and either
- set human configuration value `modelPath` for each model or
- set global configuration value `baseModelPath` to location of downloaded models

To use alternative models from a CDN use location prefix `https://www.jsdelivr.com/package/npm/@vladmandic/human-models/models/` for either configuration value of `modelPath` or `baseModelPath`

## Changes

All models are modified from original implementation in following manner:

- Input pre-processing: image enhancements, normalization, etc.
- Caching: custom caching operations to bypass specific model runs when no changes are detected
- Output parsing: custom analysis of HeatMaps to regions, output values normalization, etc.
- Output interpolation: custom smoothing operations
- Model modifications:
  - Model definition: reformatted for readability, added conversion notes and correct signatures
  - Model weights: quantized to 16-bit float values for size reduction

Models are not re-trained so any bias included in the original models is present in `Human`  
*For any possible bias notes, see specific model cards*  

<br>

## Using Alternatives

`Human` includes implementations for several alternative models which can be switched on-the-fly while keeping standardized `input` and `results` object structure

Switching model also automatically switches implementation used inside `Human` so it is critical to keep model filenames in original form  

`Human` includes all default models while alternative models are kept in a separate repository due to size considerations and must be downloaded manually from <https://github.com/vladmandic/human-models>

<br>

**Body detection** can be switched from `PoseNet` to `BlazePose`, `EfficientPose` or `MoveNet` depending on the use case:

- `PoseNet`: Works with multiple people in frame, works with only partial people  
  Best described as works-anywhere, but not with great precision
- `MoveNet-Lightning`: Works with single person in frame, works with only partial people  
  Modernized and optimized version of PoseNet with different model architecture
- `MoveNet-Thunder`: Variation of `MoveNet` with higher precision but slower processing
- `EfficientPose`: Works with single person in frame, works with only partial people  
  Experimental model that shows future promise but is not ready for wide spread usage due to performance
- `BlazePose`: Works with single person in frame and that person should be fully visibile  
  But if conditions are met, it returns far more details (39 vs 17 keypoints) and is far more accurate  
  Furthermore, it returns 3D approximation of each point instead of 2D

**Face description** can be switched from default combined model `FaceRes` to individual models

- `Gender Detection`: Oarriaga Gender
- `Age Detection`: SSR-Net Age IMDB
- `Face Embedding`: BecauseofAI MobileFace Embedding

**Object detection** can be switched from `centernet` to `nanodet`

**Hand destection** can be switched from `handdetect` to `handtrack`

**Body Segmentation** can be switched from `rvm` to `selfie` or `meet`

<br><hr><br>

## List of all models included in Human library

<br>

| Model Name | Model Definition Size | Model Definition | Weights Size | Weights Name | Num Tensors | Resolution |
| ---------- | --------------------- | ---------------- | ------------ | ------------ | ----------- | ---------- |
| Anti-Spoofing | 8K | antispoof.json | 834K | antispoof.bin | 11 |
| BecauseofAI MobileFace | 33K | mobileface.json | 2.1M | mobileface.bin | 75 | 112x112
| EfficientPose | 134K | efficientpose.json | 5.6M | efficientpose.bin | 217 | 368x368
| FaceBoxes | 212K | faceboxes.json | 2.0M | faceboxes.bin | 350 | 0x0
| FaceRes | 70K | faceres.json | 6.7M | faceres.bin | 128 | 224x224
| FaceRes (Deep) | 62K | faceres.json | 13.9M | faceres.bin | 128 | 224x224
| GEAR Predictor (Gender/Emotion/Age/Race) | 28K | gear.json | 1.5M | gear.bin | 25 | 198x198
| Google Selfie | 82K | selfie.json | 208K | selfie.bin | 136 | 256x256
| Hand Tracking | 605K | handtrack.json | 2.9M | handtrack.bin | 619 | 320x320
| Liveness | 17K | liveness.json | 580K | liveness.bin | 23 | 32x32
| MB3-CenterNet | 197K | nanodet.json | 1.9M | nanodet.bin | 267 | 128x128
| MediaPipe BlazeFace (Front) |  51K | blazeface-front.json | 323K | blazeface-front.bin | 73 | 128x128
| MediaPipe BlazeFace (Back) |  78K | blazeface-back.json | 527K | blazeface-back.bin | 112 | 256x256
| MediaPipe BlazePose (Lite) | 132K | blazepose-lite.json | 2.6M | blazepose-lite.bin | 177 | 256x256
| MediaPipe BlazePose (Full) | 145K | blazepose-full.json | 6.6M | blazepose-full.bin | 193 | 256x256
| MediaPipe BlazePose (Heavy) | 305K | blazepose-heavy.json | 27.0M | blazepose-heavy.bin | 400 | 256x256
| MediaPipe BlazePose Detector (2D) | 129K | blazepose-detector2d.json | 7.2M | blazepose-detector2d.bin | 180 | 224x224
| MediaPipe BlazePose Detector (3D) | 132K | blazepose-detector3d.json | 5.7M | blazepose-detector3d.bin | 181 | 224x224
| MediaPipe FaceMesh | 94K | facemesh.json | 1.5M | facemesh.bin | 120 | 192x192
| MediaPipe FaceMesh with Attention |  889K | facemesh-attention.json | 2.3M | facemesh-attention.bin | 1061 | 192x192
| MediaPipe Hand Landmark (Full) | 81K | handlandmark-full.json | 5.4M | handlandmark-full.bin | 112 | 224x224
| MediaPipe Hand Landmark (Lite) | 82K | handlandmark-lite.json | 2.0M | handlandmark-lite.bin | 112 | 224x224
| MediaPipe Hand Landmark (Sparse) | 88K | handlandmark-sparse.json | 5.3M | handlandmark-sparse.bin | 112 | 224x224
| MediaPipe HandPose (HandDetect) | 126K | handdetect.json | 6.8M | handdetect.bin | 152 | 256x256
| MediaPipe HandPose (HandSkeleton) | 127K | handskeleton.json | 5.3M | handskeleton.bin | 145 | 256x256
| MediaPipe Iris | 120K | iris.json | 2.5M | iris.bin | 191 | 64x64
| MediaPipe Meet | 94K | meet.json | 364K | meet.bin | 163 | 144x256
| MediaPipe Selfie | 82K | selfie.json | 208M | selfie.bin | 136 | 256x256
| MoveNet-Lightning | 158K | movenet-lightning.json | 4.5M | movenet-lightning.bin | 180 | 192x192
| MoveNet-MultiPose | 235K | movenet-thunder.json | 9.1M | movenet-thunder.bin | 303 | 256x256
| MoveNet-Thunder | 158K | movenet-thunder.json | 12M | movenet-thunder.bin | 178 | 256x256
| NanoDet | 255K | nanodet.json | 7.3M | nanodet.bin | 229 | 416x416
| Oarriaga Emotion | 18K | emotion.json | 802K | emotion.bin | 23 | 64x64
| Oarriaga Gender | 30K | gender.json | 198K | gender.bin | 39 | 64x64
| HSE-AffectNet | 47K | affectnet-mobilenet.json | 6.7M | affectnet-mobilenet.bin | 64 | 224x224
| PoseNet |  47K | posenet.json | 4.8M | posenet.bin | 62 | 385x385
| Sirius-AI MobileFaceNet | 125K | mobilefacenet.json | 5.0M | mobilefacenet.bin | 139 | 112x112
| SSR-Net Age (IMDB) | 93K | age.json | 158K | age.bin | 158 |64x64
| SSR-Net Gender (IMDB) | 92K | gender-ssrnet-imdb.json | 158K | gender-ssrnet-imdb.bin | 157 | 64x64
| Robust Video Matting | 600K | rvm.json | 3.6M | rvm.bin | 425 |512x512

<br>

*Note: All model definitions JSON files are parsed for human readability*

<br><hr><br>

## Credits

- Age & Gender Prediction: [**SSR-Net**](https://github.com/shamangary/SSR-Net)
- Anti-Spoofing: [**Real-of-Fake**](https://www.kaggle.com/anku420/fake-face-detection)
- Body Pose Detection: [**BlazePose**](https://drive.google.com/file/d/10IU-DRP2ioSNjKFdiGbmmQX81xAYj88s/view)
- Body Pose Detection: [**EfficientPose**](https://github.com/daniegr/EfficientPose)
- Body Pose Detection: [**MoveNet**](https://blog.tensorflow.org/2021/05/next-generation-pose-detection-with-movenet-and-tensorflowjs.html)
- Body Pose Detection: [**PoseNet**](https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5)
- Body Segmentation: [**MediaPipe Meet**](https://drive.google.com/file/d/1lnP1bRi9CSqQQXUHa13159vLELYDgDu0/preview)
- Body Segmentation: [**MediaPipe Selfie**](https://drive.google.com/file/d/1dCfozqknMa068vVsO2j_1FgZkW_e3VWv/preview)
- Body Segmentation: [**Robust Video Matting**](https://github.com/PeterL1n/RobustVideoMatting)
- Emotion Prediction: [**Oarriaga**](https://github.com/oarriaga/face_classification)
- Emotion Prediction: [**HSE-AffectNet**](https://github.com/HSE-asavchenko/face-emotion-recognition)
- Eye Iris Details: [**MediaPipe Iris**](https://drive.google.com/file/d/1bsWbokp9AklH2ANjCfmjqEzzxO1CNbMu/view)
- Face Description: [**HSE-FaceRes**](https://github.com/HSE-asavchenko/HSE_FaceRec_tf)
- Face Detection: [**MediaPipe BlazeFace**](https://drive.google.com/file/d/1f39lSzU5Oq-j_OXgS67KfN5wNsoeAZ4V/view)
- Face Embedding: [**BecauseofAI MobileFace**](https://github.com/becauseofAI/MobileFace)
- Face Embedding: [**DeepInsight InsightFace**](https://github.com/deepinsight/insightface)
- Facial Spacial Geometry: [**MediaPipe FaceMesh**](https://drive.google.com/file/d/1VFC_wIpw4O7xBOiTgUldl79d9LA-LsnA/view)
- Facial Spacial Geometry with Attention: [**MediaPipe FaceMesh Attention Variation**](https://arxiv.org/abs/2006.10962)
- Gender, Emotion, Age, Race Prediction: [**GEAR Predictor**](https://github.com/Udolf15/GEAR-Predictor)
- Hand Detection & Skeleton: [**MediaPipe HandPose**](https://drive.google.com/file/d/1sv4sSb9BSNVZhLzxXJ0jBv9DqD-4jnAz/view)
- Hand Tracking: [**HandTracking**](https://github.com/victordibia/handtracking)
- Image Filters: [**WebGLImageFilter**](https://github.com/phoboslab/WebGLImageFilter)
- ObjectDetection: [**MB3-CenterNet**](https://github.com/610265158/mobilenetv3_centernet)
- ObjectDetection: [**NanoDet**](https://github.com/RangiLyu/nanodet)
- Pinto Model Zoo: [**Pinto**](https://github.com/PINTO0309/PINTO_model_zoo)

*Included models are included under license inherited from the original model source*  
*Model code has substantially changed from source that it is considered a derivative work and not simple re-publishing*
