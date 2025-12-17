export default {
    title: 'Comparing Multiple Importance Sampling strategies',
    slug: 'getting-started-pbr',
    date: '2025-01-15',
    excerpt: 'A deep dive into (combinations) of sampling strategies for Multiple Importance Sampling',
    content: `
# Introduction
In this article, we will explore and compare different strategies for Multiple Importance Sampling (MIS) in rendering based on their effectiveness and performance impact. 

# What is Multiple Importance Sampling?
Multiple Importance Sampling (MIS) is a technique used to reduce variance in Monte Carlo integration by combining different sampling strategies.
The idea is to leverage the strengths of various sampling methods to achieve better overall results in rendering scenes with complex lighting and materials by reducing the variance.

# Sampling Strategies
We will compare the following MIS strategies in combination with each other:
- BSDF Sampling
- Light Sampling (Next Event Estimation)
- Environment Sampling
- BSDF split lobe sampling
    - Equal SPP
    - Equal Cost

# Evaluation Metrics
To evaluate the performance of each MIS strategy, we will consider the following metrics at different sample counts (1, 4, 16, 64, 256 samples per pixel):
- Computation: Render time
- Accuracy & convergence: FLIP error curves over the samples

# Experimental Setup
We will set up a series of test scenes with varying complexity, including different light sources, materials, and geometries. 
These scenes are the following:
- Scene 1: Veach MIS scene.
TODO Refrence image
- Scene 2: Sponza.
TODO Refrence image
- Scene 3: Bistro outside.
TODO Refrence image
- Scene 4: Bistro inside.
TODO Refrence image

Each scene will be rendered using the different MIS strategies, and the results will be compared based on the evaluation metrics mentioned above.

## Split Lobe Sampling Budget
Split lobe tests will be conducted under two conditions:
1. **Equal SPP**: Split lobe uses N samples per lobe (N× cost vs unified)
2. **Equal Cost**: Split lobe divides sample budget across lobes (same cost)

This reveals both the quality ceiling (equal SPP) and practical value (equal cost).


# Results and Analysis
The results of our experiments will be presented in the form of images and graphs, showcasing the performance of each MIS strategy. 
We will analyze the strengths and weaknesses of each approach, highlighting scenarios where certain strategies excel or fall short.

- BSDF only (baseline)
- BSDF + Light NEE
- BSDF + Env NEE
- BSDF + Light + Env NEE
- Split lobe BSDF only
- Split lobe + Light NEE
- Split lobe + Env NEE
- Split lobe + Light + Env NEE

# Conclusion

# Sources   


  `,
    tags: ['Graphics', 'MIS']
};