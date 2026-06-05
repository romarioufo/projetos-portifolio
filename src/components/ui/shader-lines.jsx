"use client"

import { useEffect, useRef } from "react"

export function ShaderAnimation() {
  const containerRef = useRef(null)
  const sceneRef = useRef({
    camera: null,
    scene: null,
    renderer: null,
    uniforms: null,
    animationId: null,
    resizeHandler: null,
  })

  useEffect(() => {
    // Load Three.js dynamically
    const existing = document.querySelector('script[data-threejs]')
    if (existing) {
      if (window.THREE) initThreeJS()
      else existing.addEventListener('load', initThreeJS)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js"
    script.setAttribute('data-threejs', 'true')
    script.onload = () => {
      if (containerRef.current && window.THREE) initThreeJS()
    }
    document.head.appendChild(script)

    return () => {
      const refs = sceneRef.current
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      if (refs.resizeHandler) window.removeEventListener("resize", refs.resizeHandler)
      if (refs.renderer) {
        refs.renderer.dispose()
        if (refs.renderer.domElement?.parentNode) {
          refs.renderer.domElement.parentNode.removeChild(refs.renderer.domElement)
        }
      }
    }
  }, [])

  const initThreeJS = () => {
    if (!containerRef.current || !window.THREE) return
    const THREE = window.THREE
    const container = containerRef.current
    container.innerHTML = ""

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneBufferGeometry(2, 2)

    const uniforms = {
      time:       { type: "f",  value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      float random(in float x) { return fract(sin(x)*1e4); }
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      // ── UFO SDF ──────────────────────────────────────────────
      // Approximate ellipse SDF (fast version)
      float sdEllipse(vec2 p, vec2 ab) {
        vec2 q = abs(p);
        float h = clamp(dot(q,ab) / dot(ab,ab), 0.0, 1.0);
        return length(q - ab*h) * sign(q.x*ab.y + q.y*ab.x - ab.x*ab.y);
      }

      float ufoSDF(vec2 p) {
        // Saucer body — wide flat ellipse
        float saucer = sdEllipse(p, vec2(0.40, 0.072));

        // Dome — smaller ellipse on top, clipped to upper half
        vec2 dp = p - vec2(0.0, 0.072);
        float dome = sdEllipse(dp, vec2(0.145, 0.11));
        dome = max(dome, -dp.y);          // keep only upper hemisphere

        // Ring detail — thin band around saucer edge
        float ring = abs(saucer) - 0.012;

        return min(min(saucer, dome), ring);
      }
      // ─────────────────────────────────────────────────────────

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

        // Pixel-mosaic quantisation (original look)
        vec2 fMosaicScal = vec2(4.0, 2.0);
        vec2 vScreenSize = vec2(256.0, 256.0);
        uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
        uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

        // ── UFO silhouette — positioned below center ─────────
        vec2 ufoCenter = vec2(0.0, -0.28);   // lower half of screen
        vec2 uvUfo = uv - ufoCenter;
        float ufo    = ufoSDF(uvUfo);
        float inside = smoothstep(0.012, -0.012, ufo);
        float edge   = smoothstep(0.05,   0.0,   abs(ufo));
        float halo   = smoothstep(0.18,   0.0,   abs(ufo)) * 0.14;

        // Warp UV near the UFO edge (lines bend around it)
        vec2 uvWarp = uv;
        float warpStrength = 0.022 * edge;
        vec2 gradP = vec2(
          ufoSDF(uvUfo + vec2(0.001, 0.0)) - ufoSDF(uvUfo - vec2(0.001, 0.0)),
          ufoSDF(uvUfo + vec2(0.0, 0.001)) - ufoSDF(uvUfo - vec2(0.0, 0.001))
        );
        vec2 grad = length(gradP) > 0.0001 ? normalize(gradP) : vec2(0.0);
        uvWarp += grad * warpStrength;
        // ─────────────────────────────────────────────────────

        float t = time * 0.06 + random(uvWarp.x) * 0.4;
        float lineWidth = 0.0008;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            float c = lineWidth * float(i*i) / abs(fract(t - 0.01*float(j) + float(i)*0.01)*1.0 - length(uvWarp));
            // Attenuate lines inside UFO body → creates dark shadow silhouette
            c *= mix(1.0, 0.12, inside * 0.85);
            color[j] += c;
          }
        }

        // Subtle edge glow (faint white-blue outline tracing the UFO)
        color += vec3(0.10, 0.14, 0.22) * edge * 0.6;

        // Ambient halo blending into the lines
        color += vec3(0.04, 0.06, 0.12) * halo;

        // Pulsing beacon at dome tip
        vec2 beaconP = uv - (ufoCenter + vec2(0.0, 0.185));
        float beacon = smoothstep(0.018, 0.0, length(beaconP));
        float beaconPulse = 0.5 + 0.5 * sin(time * 0.85);
        color += vec3(0.5, 0.75, 1.0) * beacon * beaconPulse * 0.55;

        // Tiny running lights on saucer rim
        float rimAngle = atan(uvUfo.y * 6.0, uvUfo.x);
        float rimDist  = abs(ufo);
        float rimLight = smoothstep(0.018, 0.0, rimDist)
                       * (0.5 + 0.5 * sin(rimAngle * 6.0 - time * 1.2)) * 0.3;
        color += vec3(0.8, 0.6, 0.3) * rimLight;

        gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
      }
    `

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const onResize = () => {
      const rect = container.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }
    onResize()
    window.addEventListener("resize", onResize, false)

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: null, resizeHandler: onResize }

    const animate = () => {
      sceneRef.current.animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
    }
    animate()
  }

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />
}
